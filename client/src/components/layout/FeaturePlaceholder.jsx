import { Link } from 'react-router-dom';
import { ROUTES } from '../../app/routes.js';
import PageHeader from '../ui/PageHeader.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card.jsx';

/**
 * Reusable placeholder component for scheduled feature routes.
 *
 * Honestly communicates implementation status to users and developers
 * without mocking or fabricating application functionality.
 *
 * @param {object} props
 * @param {string} props.title - The feature route name
 * @param {string} props.promptStage - E.g. "Prompt 3/22: Authentication"
 * @param {string} props.description - Summary of what will be implemented
 * @param {string[]} [props.plannedCapabilities] - Key capabilities planned for this module
 */
export default function FeaturePlaceholder({
  title,
  promptStage,
  description,
  plannedCapabilities = [],
}) {
  return (
    <div className="page-container">
      <PageHeader
        title={title}
        description="This section is part of the planned roadmap and will be implemented in an upcoming prompt."
        badge={
          <Badge variant="warning" size="md">
            Scheduled Module
          </Badge>
        }
        actions={
          <Button as={Link} to={ROUTES.HOME} variant="outline" size="sm">
            &larr; Return to Home
          </Button>
        }
      />

      <div className="placeholder-content">
        <Card className="placeholder-card">
          <CardHeader>
            <div className="placeholder-card__meta">
              <Badge variant="primary" size="sm">
                {promptStage}
              </Badge>
              <span className="placeholder-card__status-text">
                Foundation Shell Active
              </span>
            </div>
            <CardTitle>{title} Module</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="placeholder-card__desc">{description}</p>

            {plannedCapabilities.length > 0 && (
              <div className="placeholder-card__capabilities">
                <h4 className="placeholder-card__capabilities-title">
                  Planned Capabilities for This Module:
                </h4>
                <ul className="placeholder-card__capabilities-list">
                  {plannedCapabilities.map((capability, index) => (
                    <li key={index} className="placeholder-card__capability-item">
                      <span className="placeholder-card__bullet" aria-hidden="true">
                        &bull;
                      </span>
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="placeholder-card__notice">
              <strong>Notice:</strong> Per project architecture, frontend presentation
              is strictly decoupled from server-side validation. Fake booking allocations
              or mock credentials are not used. Real interactive behavior will be connected
              once the corresponding backend endpoints are established.
            </div>
          </CardContent>

          <CardFooter>
            <div className="placeholder-card__footer-actions">
              <Button as={Link} to={ROUTES.HOME} variant="primary">
                Explore Implemented Shell
              </Button>
              <Button as={Link} to={ROUTES.RESOURCES} variant="secondary">
                View All Routes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
