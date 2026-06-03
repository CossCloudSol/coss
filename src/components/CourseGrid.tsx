import CourseCard, { CourseCardProps } from './CourseCard'

interface CourseGridProps {
  courses: CourseCardProps[]
}

export default function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
      {courses.map((course, i) => (
        <CourseCard key={course.title} {...course} animationIndex={i} />
      ))}
    </div>
  )
}
