export default function CategorySidebar({ toolGroups, selectedCategory, onSelectCategory }) {
  return (
    <aside className="w-16 border-r border-zinc-800 bg-zinc-900 shrink-0 flex flex-col py-3 gap-1 z-20 shadow-xl">
      {toolGroups.map((group) => {
        const Icon = group.icon;
        const isActive = selectedCategory === group.id;
        return (
          <button
            key={group.id}
            onClick={() => onSelectCategory(group.id)}
            className={`relative group flex flex-col items-center justify-center h-14 mx-2 rounded-xl transition-all ${
              isActive ? 'bg-zinc-800 text-cyan-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
            title={group.name}
          >
            <Icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : ''} />
            <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              {group.name}
            </div>
          </button>
        );
      })}
    </aside>
  );
}
