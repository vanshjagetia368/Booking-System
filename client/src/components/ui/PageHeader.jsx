/**
 * Reusable Page Header Component
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.badge]
 * @param {React.ReactNode} [props.actions]
 * @param {string} [props.className='']
 */
export default function PageHeader({
  title,
  description,
  badge,
  actions,
  className = '',
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="page-header__main">
        <div className="page-header__title-row">
          <h1 className="page-header__title">{title}</h1>
          {badge && <div className="page-header__badge">{badge}</div>}
        </div>
        {description && (
          <p className="page-header__description">{description}</p>
        )}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
