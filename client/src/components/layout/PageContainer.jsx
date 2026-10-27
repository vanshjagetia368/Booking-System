/**
 * Reusable Page Container Layout Component
 *
 * Constrains and centers page content with responsive horizontal padding and margins.
 *
 * @param {object} props
 * @param {React.ElementType} [props.as='div'] - Element tag
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'full'} [props.size='lg'] - Width constraint
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 */
export default function PageContainer({
  as: Component = 'div',
  size = 'lg',
  className = '',
  children,
  ...restProps
}) {
  const containerClasses = [
    'page-container',
    size !== 'lg' ? `page-container--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={containerClasses} {...restProps}>
      {children}
    </Component>
  );
}
