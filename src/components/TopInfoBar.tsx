import { GraduationCap, Mail, MapPin, Phone, Star } from 'lucide-react';
import { getHomepageSettings } from '@/lib/get-homepage-settings';
import { getBranchSettings } from '@/lib/get-branch-settings';

export default async function TopInfoBar() {
  const [hpSettings, branch] = await Promise.all([
    getHomepageSettings(),
    getBranchSettings('dilsukhnagar'),
  ]);

  const rating = branch.aggregateRating.toFixed(1);
  const studentsPlaced = hpSettings.stat2Value;

  return (
    <div className="header-topbar">
      <div className="header-topbar-inner">
        <div className="header-topbar-left">
          <a href="tel:+918885166007" className="htb-item htb-phone">
            <Phone className="htb-icon" aria-hidden="true" />
            <span>+91 88851 66007</span>
          </a>
          <span className="htb-sep" aria-hidden="true">·</span>
          <a href="tel:+917780727374" className="htb-item">
            <span>+91 77807 27374</span>
          </a>
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
          <span className="htb-item">
            <Star className="htb-icon htb-star" aria-hidden="true" />
            <strong>{rating}/5</strong>&nbsp;Google Rating
          </span>
          <span className="htb-sep" aria-hidden="true">·</span>
          <span className="htb-badge">
            <GraduationCap className="htb-icon" style={{ width: 12, height: 12 }} aria-hidden="true" />
            {studentsPlaced} Placements
          </span>
        </div>
      </div>
    </div>
  );
}
