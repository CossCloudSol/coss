import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import CallLink from './CallLink';

export default function TopInfoBar() {
  return (
    <div className="header-topbar">
      <div className="header-topbar-inner">
        <div className="header-topbar-left">
          <CallLink number="+918885166007" className="htb-item htb-phone">
            <Phone className="htb-icon" aria-hidden="true" />
            <span>+91 88851 66007</span>
          </CallLink>
          <span className="htb-sep" aria-hidden="true">·</span>
          <CallLink number="+917780727374" className="htb-item">
            <span>+91 77807 27374</span>
          </CallLink>
          <span className="htb-sep" aria-hidden="true">·</span>
          <a href="mailto:info@cosscloudsol.com" className="htb-item">
            <Mail className="htb-icon" aria-hidden="true" />
            <span>info@cosscloudsol.com</span>
          </a>
        </div>

        <div className="header-topbar-right">
          <span className="htb-item">
            <MapPin className="htb-icon" aria-hidden="true" />
            <span>Dilsukhnagar &amp; Ameerpet</span>
          </span>
          <span className="htb-sep" aria-hidden="true">·</span>
          <span className="htb-badge">
            <GraduationCap className="htb-icon" style={{ width: 12, height: 12 }} aria-hidden="true" />
            5,000+ Students Trained
          </span>
        </div>
      </div>
    </div>
  );
}
