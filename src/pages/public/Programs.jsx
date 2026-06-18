import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { appClient } from '@/api/appClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Clock, Users, BookOpen, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const typeLabels = {
  webinar: 'Webinar', workshop: 'Workshop', bootcamp: 'Bootcamp',
  certification: 'Certification', corporate_training: 'Corporate', executive_program: 'Executive'
};

const modeLabels = { online: 'Online', offline: 'Offline', hybrid: 'Hybrid' };
const levelLabels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', executive: 'Executive' };

export default function Programs() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs-public'],
    queryFn: () => appClient.entities.Program.list('-created_date'),
  });

  const filtered = programs.filter(p => {
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.program_type === typeFilter;
    const matchesMode = modeFilter === 'all' || p.delivery_mode === modeFilter;
    return matchesSearch && matchesType && matchesMode;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold font-heading mb-3">Our Programs</h1>
          <p className="text-primary-foreground/70 max-w-2xl">Discover practical capability-building programs across AI, analytics, cybersecurity, and executive transformation.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              {Object.entries(modeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Programs Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5">
                <Skeleton className="h-40 w-full rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((program) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="h-40 bg-gradient-to-br from-secondary/20 to-accent/10 flex items-center justify-center relative">
                  {program.thumbnail_url ? (
                    <img src={program.thumbnail_url} alt={program.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-secondary/40" />
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge className="bg-secondary/90 text-white text-[10px]">{typeLabels[program.program_type] || program.program_type}</Badge>
                    <Badge variant="outline" className="bg-white/90 text-[10px]">{modeLabels[program.delivery_mode] || program.delivery_mode}</Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold font-heading text-lg mb-2 group-hover:text-secondary transition-colors">{program.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{program.description || 'Professional training program'}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {program.duration_hours && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{program.duration_hours}h</span>
                    )}
                    {program.capacity && (
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{program.capacity} seats</span>
                    )}
                    {program.level && (
                      <Badge variant="outline" className="text-[10px]">{levelLabels[program.level]}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg font-heading text-secondary">
                      {program.price ? `IDR ${program.price.toLocaleString()}` : 'Free'}
                    </span>
                    <Link to={`/programs/${program.id}`}>
                      <Button size="sm" variant="outline" className="group-hover:bg-secondary group-hover:text-white group-hover:border-secondary transition-colors">
                        Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No programs found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
