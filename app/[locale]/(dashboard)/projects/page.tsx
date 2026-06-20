// TODO: Module — Projects
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Projects' }

export default function ProjectsPage() {
  const planned = ['Project boards','Task management,Time tracking,Budget tracking,Team collaboration']
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Projects</h1>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Coming Soon
        </span>
      </div>
      <p className="text-muted-foreground max-w-lg">
        The Projects module is under development. Here is what is planned:
      </p>
      <ul className="space-y-2">
        {planned.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
