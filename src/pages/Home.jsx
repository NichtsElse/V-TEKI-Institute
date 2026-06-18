import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, Award, BookOpen, Users, Zap, GraduationCap, Building2, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: BookOpen, title: 'AI & Data Science', desc: 'Master cutting-edge AI, ML, and data analytics skills with hands-on projects.' },
  { icon: Zap, title: 'Digital Transformation', desc: 'Lead organizational change with strategic digital transformation frameworks.' },
  { icon: Users, title: 'Executive Education', desc: 'Tailored programs for C-suite leaders and senior management teams.' },
  { icon: Award, title: 'Certifications', desc: 'Industry-recognized certifications with verified digital credentials.' },
];

const stats = [
  { value: '1,200+', label: 'Participants Reached' },
  { value: '40+', label: 'Programs Delivered' },
  { value: '12+', label: 'Industry Mentors' },
  { value: '92%', label: 'Completion Rate' },
];

const programTypes = [
  { icon: Globe, label: 'Webinars', desc: 'Live online sessions' },
  { icon: BookOpen, label: 'Workshops', desc: 'Intensive skill building' },
  { icon: GraduationCap, label: 'Bootcamps', desc: 'Immersive learning' },
  { icon: Award, label: 'Certifications', desc: 'Professional credentials' },
  { icon: Building2, label: 'Corporate', desc: 'Custom team training' },
  { icon: Users, label: 'Executive', desc: 'Leadership programs' },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/30" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-primary-foreground/80">New Programs Available — Enroll Now</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
              Accelerate Your
              <span className="text-accent"> Digital </span>
              Career
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-primary-foreground/70 max-w-xl mb-8 leading-relaxed">
              Professional training in AI, Data Science, and Digital Transformation. 
              Get certified, get ahead.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/programs">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8">
                  Explore Programs <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/verify-certificate">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold px-8">
                  Verify Certificate
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold font-heading text-secondary">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-heading mb-3">Why V-TEKI Institute?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Capability-building programs designed to strengthen teams, professionals, and leadership functions.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold font-heading mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Types */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-heading mb-3">Program Types</h2>
            <p className="text-muted-foreground">Choose the learning format that suits you best.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {programTypes.map((pt) => (
              <Link to="/programs" key={pt.label}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-card rounded-xl border border-border p-5 text-center hover:shadow-lg hover:border-secondary/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-3 group-hover:bg-secondary group-hover:text-white transition-colors">
                    <pt.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold font-heading">{pt.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{pt.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-10 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl lg:text-3xl font-bold font-heading text-primary-foreground mb-4">
                Ready to Transform Your Career?
              </h2>
              <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto">
                Join professionals and institutions building practical capability with V-TEKI Institute.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/programs">
                  <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8">
                    Browse Programs
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold px-8">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
