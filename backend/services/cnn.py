import os
import cv2
import numpy as np
import json

# Lazy loading dictionary to cache multiple models
loaded_models = {}

def load_model(model_path):
    global loaded_models
    if model_path in loaded_models:
        return loaded_models[model_path]

    try:
        import tensorflow as tf
    except ImportError:
        raise Exception("TensorFlow is not installed on the backend server. Cannot run CNN inference.")

    if not os.path.exists(model_path):
        raise Exception(f"CNN model not found: {model_path}")

    try:
        model = tf.keras.models.load_model(model_path)
        loaded_models[model_path] = model
    except Exception as e:
        raise Exception(f"Failed to load CNN model: {str(e)}")
        
    return model

def predict_image(img: np.ndarray, dataset: str = "fruits", model_type: str = "scratch") -> dict:
    """Predicts the image class using the CNN model."""
    
    if dataset == "fruits" and model_type == "scratch":
        model_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "scratch", "fruits.keras")
        labels_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "scratch", "realworld_fruits5_display_names.json")
    elif dataset == "fruits" and model_type == "pretrained":
        model_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "pretrained", "fruits_pretrained_best.keras")
        labels_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "pretrained", "fruits_class_names.json")
    elif dataset == "intel" and model_type == "scratch":
        model_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "scratch", "intel_scratch_best.keras")
        labels_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "scratch", "intel_class_names.json")
    elif dataset == "intel" and model_type == "pretrained":
        model_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "pretrained", "intel_pretrained_best.keras")
        labels_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "pretrained", "intel_class_names.json")
    elif dataset == "animals" and model_type == "scratch":
        model_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "scratch", "animals_scratch_best.keras")
        labels_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "scratch", "animals_class_names.json")
    elif dataset == "animals" and model_type == "pretrained":
        model_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "pretrained", "animals_pretrained_best.keras")
        labels_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "pretrained", "animals_class_names.json")
    else:
        # Return a stubbed response for everything else since they are not implemented yet.
        return {
            "label": "Not Implemented",
            "confidence": 1.0,
            "scores": {
                "Not Implemented": 1.0
            }
        }
    
    if not os.path.exists(labels_path):
        raise Exception(f"Class labels not found: {labels_path}")
        
    with open(labels_path, "r") as f:
        classes = json.load(f)
    
    try:
        current_model = load_model(model_path)
        import tensorflow as tf
        
        # Preprocess image
        input_shape = getattr(current_model, 'input_shape', None)
        if input_shape and len(input_shape) >= 3 and input_shape[1] is not None:
            target_size = (input_shape[1], input_shape[2])
        else:
            target_size = (150, 150) # Fallback common size
            
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize
        resized = cv2.resize(img_rgb, target_size)
        
        # Both Scratch and Pretrained Kaggle models were trained on [0, 255] directly
        img_normalized = resized.astype(np.float32)
        
        # Add batch dimension
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        # Predict
        if hasattr(current_model, "predict"):
            predictions = current_model.predict(img_batch, verbose=0)[0]
        else:
            preds = current_model(img_batch)
            if isinstance(preds, dict):
                predictions = list(preds.values())[0].numpy()[0]
            else:
                predictions = preds.numpy()[0]
        
        # Get highest probability
        predicted_idx = np.argmax(predictions)
        label = classes[predicted_idx]
        confidence = float(predictions[predicted_idx])
        
        scores = {classes[i]: float(predictions[i]) for i in range(len(classes))}
        
        return {
            "label": label,
            "confidence": confidence,
            "scores": scores,
            "ood_warning": confidence < 0.60
        }
        
    except Exception as e:
        raise Exception(str(e))
