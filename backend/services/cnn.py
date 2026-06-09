import os
import cv2
import numpy as np

# Lazy loading to prevent server crash if not installed
model = None

def load_model():
    global model
    if model is not None:
        return model

    try:
        import tensorflow as tf
    except ImportError:
        raise Exception("TensorFlow is not installed on the backend server. Cannot run CNN inference.")

    model_path = os.path.join(os.path.dirname(__file__), "..", "cnn", "saved_model")
    if not os.path.exists(model_path):
        raise Exception("CNN model not found. Please ensure backend/cnn/saved_model exists.")

    try:
        if hasattr(tf.keras.layers, "TFSMLayer"):
            model = tf.keras.layers.TFSMLayer(model_path, call_endpoint='serving_default')
        else:
            model = tf.keras.models.load_model(model_path)
    except Exception as e:
        raise Exception(f"Failed to load CNN model: {str(e)}")
        
    return model

def predict_animal(img: np.ndarray) -> dict:
    """Predicts the animal class using the CNN model."""
    classes = ["cat", "dog", "elephant", "horse", "lion"]
    
    try:
        current_model = load_model()
        import tensorflow as tf
        
        # Preprocess image
        # The model likely expects RGB and a certain size, let's assume 150x150 or 224x224
        # Since we don't know the exact size from README, we might check the model's input shape
        # But we can try 224x224 which is standard, or check input_shape dynamically
        input_shape = getattr(current_model, 'input_shape', None)
        if input_shape and len(input_shape) >= 3 and input_shape[1] is not None:
            target_size = (input_shape[1], input_shape[2])
        else:
            target_size = (150, 150) # Fallback common size
            
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize
        resized = cv2.resize(img_rgb, target_size)
        
        # Normalize to [0, 1] assuming standard keras behavior
        img_normalized = resized.astype(np.float32) / 255.0
        
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
            "scores": scores
        }
        
    except Exception as e:
        raise Exception(str(e))
