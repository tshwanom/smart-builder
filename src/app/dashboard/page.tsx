
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, FileText, ChevronRight, Calculator } from 'lucide-react'
import { CreateProjectButton } from './CreateProjectButton'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.email) redirect('/auth/signin?callbackUrl=/dashboard')

  const user = await prisma.user.findUnique({
      where: { email: session.user.email }
  })

  // If user doesn't exist in DB (shouldn't happen if logged in correctly but safe guard)
  if (!user) redirect('/auth/signin')

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
        id: true,
        name: true,
        clientName: true,
        updatedAt: true,
        isUnlocked: true,
        country: {
            select: { code: true, name: true }
        }
    }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                 <Calculator size={18} />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Mebala Construction</h1>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">
                {session.user.name || session.user.email}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
                {(session.user.name || session.user.email || 'U')[0]}
              </div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Your Projects</h2>
            <CreateProjectButton />
         </div>

         {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <FileText size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm">
                    Create your first project to start calculating materials and costs efficiently.
                </p>
                <CreateProjectButton />
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <Link 
                        key={project.id} 
                        href={`/project/${project.id}`}
                        className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all hover:border-blue-300 flex flex-col h-full"
                    >
                        <div className="h-40 bg-slate-100 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
                             {/* Placeholder for thumbnail pattern */}
                             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
                             
                             <FileText size={48} className="text-slate-300 group-hover:text-blue-400 transition-colors z-10" />
                             
                             {project.isUnlocked && (
                                <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-10 border border-green-200">
                                    Paid
                                </div>
                             )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-2 gap-2">
                                <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={project.name}>
                                    {project.name}
                                </h3>
                                {project.country && (
                                    <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                        {project.country.code}
                                    </span>
                                )}
                            </div>
                            
                            {project.clientName ? (
                                <p className="text-sm text-slate-500 mb-4 line-clamp-1">
                                    Client: {project.clientName}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 mb-4 italic">
                                    No client specified
                                </p>
                            )}
                            
                            <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    Open <ChevronRight size={12} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
         )}
      </main>
    </div>
  )
}
