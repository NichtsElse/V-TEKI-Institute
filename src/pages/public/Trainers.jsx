import React from 'react';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Linkedin, User } from 'lucide-react';

export default function Trainers() {
  const { data: trainers = [], isLoading } = useQuery({
    queryKey: ['trainers-public'],
    queryFn: () => appClient.entities.Trainer.filter({ status: 'active' }),
  });

  return (
    <div className="min-h-screen">
      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold font-heading mb-3">Our Trainers</h1>
          <p className="text-primary-foreground/70 max-w-2xl">Learn from practitioners and advisors with hands-on delivery experience in AI, data, and transformation programs.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border p-6">
                <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-5 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map(trainer => (
              <div key={trainer.id} className="bg-card rounded-xl border border-border p-6 text-center hover:shadow-lg transition-all group">
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {trainer.profile_picture_url ? (
                    <img src={trainer.profile_picture_url} alt={trainer.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-secondary/40" />
                  )}
                </div>
                <h3 className="font-semibold font-heading text-lg">{trainer.full_name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{trainer.expertise}</p>
                {trainer.experience_years && (
                  <p className="text-xs text-muted-foreground mt-1">{trainer.experience_years} years experience</p>
                )}
                {trainer.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{trainer.bio}</p>
                )}
                {trainer.linkedin_url && (
                  <a href={trainer.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-secondary text-sm mt-3 hover:underline">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && trainers.length === 0 && (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No trainers listed yet</h3>
            <p className="text-muted-foreground text-sm">Check back soon for our expert trainer profiles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
