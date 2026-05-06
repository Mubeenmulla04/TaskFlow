export default function Avatar({ name = '', avatar, size = 'md', className = '' }) {
  const sizes = {
    xs:  'w-6 h-6 text-xs',
    sm:  'w-8 h-8 text-xs',
    md:  'w-10 h-10 text-sm',
    lg:  'w-12 h-12 text-base',
    xl:  'w-16 h-16 text-lg',
  };

  // Generate color from name
  const colors = [
    'from-brand-500 to-accent-purple',
    'from-accent-cyan to-brand-400',
    'from-accent-pink to-accent-purple',
    'from-accent-amber to-accent-pink',
    'from-accent-green to-accent-cyan',
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/10 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} 
                  flex items-center justify-center font-bold text-white flex-shrink-0 
                  ring-2 ring-white/10 ${className}`}
    >
      {initials || '?'}
    </div>
  );
}
