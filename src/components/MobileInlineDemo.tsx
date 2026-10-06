import DemoSidebarForm from '@/components/DemoSidebarForm'
import type { CourseGroup } from '@/data/course-options'

/**
 * The free-demo form placed right under the hero on phones (≤768px). On wider
 * screens it's hidden and the sidebar form is used; on phones the sidebar is
 * hidden (.page-with-sidebar), so only one form shows at any width.
 * Pass course to keep the course context, or courseGroups for a course select.
 */
export default function MobileInlineDemo(
  props: { subtitle?: string } & ({ course: string; courseGroups?: undefined } | { course?: undefined; courseGroups: CourseGroup[] }),
) {
  return (
    <div className="mobile-inline-demo">
      <DemoSidebarForm {...props} />
    </div>
  )
}
