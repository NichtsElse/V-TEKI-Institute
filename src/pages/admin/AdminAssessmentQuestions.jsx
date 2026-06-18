import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const emptyQuestion = {
  question_text: '',
  question_type: 'multiple_choice',
  options: [
    { id: 'opt1', text: '' },
    { id: 'opt2', text: '' },
    { id: 'opt3', text: '' },
    { id: 'opt4', text: '' }
  ],
  correct_answer: 'opt1',
  points: 20
};

export default function AdminAssessmentQuestions() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyQuestion);
  const [editId, setEditId] = useState(null);

  const { data: assessment, isLoading: isLoadingAssesment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      const all = await appClient.entities.Assessment.list();
      return all.find(a => a.id === assessmentId);
    },
    enabled: !!assessmentId
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: () => appClient.entities.AssessmentQuestion.filter({ assessment_id: assessmentId }),
    enabled: !!assessmentId
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, assessment_id: assessmentId };
      return editId
        ? appClient.entities.AssessmentQuestion.update(editId, payload)
        : appClient.entities.AssessmentQuestion.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessment-questions', assessmentId] });
      setDialogOpen(false);
      toast({ title: editId ? 'Question updated' : 'Question created' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.AssessmentQuestion.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assessment-questions', assessmentId] });
      toast({ title: 'Question deleted' });
    },
  });

  const openCreate = () => {
    setForm(JSON.parse(JSON.stringify(emptyQuestion)));
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (q) => {
    setForm(JSON.parse(JSON.stringify(q)));
    setEditId(q.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    // Validate
    if (!form.question_text) {
      return toast({ title: 'Question text is required', variant: 'destructive' });
    }
    const emptyOption = form.options.find(o => !o.text);
    if (emptyOption) {
      return toast({ title: 'All options must have text', variant: 'destructive' });
    }

    const { id, created_date, updated_date, created_by_id, ...data } = form;
    saveMutation.mutate(data);
  };

  const updateOption = (id, text) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map(o => o.id === id ? { ...o, text } : o)
    }));
  };

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const backUrl = user?.role === 'trainer' ? '/trainer/assessments' : '/admin/assessments';

  if (isLoadingAssesment) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!assessment) return <div className="p-8 text-center text-muted-foreground">Assessment not found</div>;

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(backUrl)} className="pl-0">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessments
        </Button>
      </div>

      <PageHeader 
        title={`Questions: ${assessment.title}`} 
        subtitle={`${questions.length} questions | Total Points: ${totalPoints} / ${assessment.total_points}`}
      >
        <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Question
        </Button>
      </PageHeader>

      <div className="space-y-4">
        {isLoadingQuestions ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No questions found for this assessment.
            </CardContent>
          </Card>
        ) : (
          questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{q.question_text}</h3>
                  <div className="space-y-1 mb-3 text-sm">
                    {q.options?.map(opt => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${q.correct_answer === opt.id ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                        <span className={q.correct_answer === opt.id ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                          {opt.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">Points: {q.points}</div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(q)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(q.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea 
                value={form.question_text} 
                onChange={e => setForm({...form, question_text: e.target.value})} 
                placeholder="Type the question here..."
                rows={3}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Options & Correct Answer *</Label>
              <RadioGroup 
                value={form.correct_answer} 
                onValueChange={v => setForm({...form, correct_answer: v})}
              >
                {form.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <RadioGroupItem value={opt.id} id={`radio-${opt.id}`} />
                    <Input 
                      value={opt.text} 
                      onChange={e => updateOption(opt.id, e.target.value)} 
                      placeholder={`Option ${i + 1}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
            </div>

            <div className="space-y-2">
              <Label>Points *</Label>
              <Input 
                type="number" 
                value={form.points} 
                onChange={e => setForm({...form, points: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-secondary hover:bg-secondary/90 text-white">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editId ? 'Update Question' : 'Add Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
