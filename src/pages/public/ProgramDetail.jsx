import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, Users, BookOpen, ArrowLeft, Calendar, 
  MapPin, CheckCircle, GraduationCap, Globe
} from 'lucide-react';
import { format } from 'date-fns';

const typeLabels = {
  webinar: 'Webinar', workshop: 'Workshop', bootcamp: 'Bootcamp',
  certification: 'Certification', corporate_training: 'Corporate', executive_program: 'Executive'
};
const modeLabels = { online: 'Online', offline: 'Offline', hybrid: 'Hybrid' };

export default function ProgramDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      const programs = await appClient.entities.Program.filter({ id });
      return programs[0];
    },
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['batches-program', id],
    queryFn: () => appClient.entities.Batch.filter({ program_id: id, status: 'open' }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-5 w-96 mb-8" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-semibold mb-2">Program not found</h2>
        <Link to="/programs"><Button variant="outline">Back to Programs</Button></Link>
      </div>
    );
  }

  const objectives = program.learning_objectives?.split('\n').filter(Boolean) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/programs" className="inline-flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Programs
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-secondary text-white">{typeLabels[program.program_type]}</Badge>
            <Badge variant="outline" className="border-white/20 text-white">{modeLabels[program.delivery_mode]}</Badge>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold font-heading mb-3">{program.name}</h1>
          <p className="text-primary-foreground/70 max-w-2xl">{program.description}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {objectives.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Learning Objectives</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Batches */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Upcoming Batches</CardTitle></CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming batches available. Check back later.</p>
                ) : (
                  <div className="space-y-4">
                    {batches.map(batch => (
                      <div key={batch.id} className="border border-border rounded-lg p-4 hover:border-secondary/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold font-heading">{batch.name}</h4>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              {batch.start_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {format(new Date(batch.start_date), 'MMM d, yyyy')}
                                  {batch.end_date && ` - ${format(new Date(batch.end_date), 'MMM d, yyyy')}`}
                                </span>
                              )}
                              {batch.venue && (
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{batch.venue}</span>
                              )}
                              {batch.meeting_link && (
                                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Online</span>
                              )}
                            </div>
                            {batch.capacity && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {batch.enrolled_count || 0}/{batch.capacity} enrolled
                              </p>
                            )}
                          </div>
                          <Link to={isAuthenticated ? `/register-program/${batch.id}` : `/login?redirect=/register-program/${batch.id}`}>
                            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white">
                              Register
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-secondary/20">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold font-heading text-secondary">
                    {program.price ? `IDR ${program.price.toLocaleString()}` : 'Free'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">per participant</p>
                </div>
                <div className="space-y-3 mb-6">
                  {program.duration_hours && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{program.duration_hours} hours</span>
                    </div>
                  )}
                  {program.capacity && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Max {program.capacity} participants</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="capitalize">{program.level || 'All Levels'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span>{typeLabels[program.program_type]}</span>
                  </div>
                </div>
                {batches.length > 0 ? (
                  <Link to={isAuthenticated ? `/register-program/${batches[0].id}` : `/login?redirect=/register-program/${batches[0].id}`}>
                    <Button className="w-full bg-secondary hover:bg-secondary/90 text-white">Register Now</Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled>No Batches Available</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}