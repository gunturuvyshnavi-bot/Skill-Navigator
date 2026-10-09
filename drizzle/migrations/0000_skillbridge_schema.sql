
CREATE TABLE public.skills (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'General',
  level text NOT NULL DEFAULT 'Intermediate',
  source text NOT NULL DEFAULT 'base'
);
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills readable" ON public.skills FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text,
  job_title text NOT NULL,
  company text,
  location text,
  state text,
  city text,
  job_description text NOT NULL,
  required_skills text[] NOT NULL DEFAULT '{}',
  experience text,
  salary text,
  employment_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs readable" ON public.jobs FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.learning_resources (
  id serial PRIMARY KEY,
  skill text NOT NULL,
  level text NOT NULL,
  resource_name text NOT NULL,
  resource_url text NOT NULL,
  description text
);
GRANT SELECT ON public.learning_resources TO anon, authenticated;
GRANT ALL ON public.learning_resources TO service_role;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources readable" ON public.learning_resources FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  extracted_text text,
  status text NOT NULL DEFAULT 'uploaded',
  error text,
  analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  UNIQUE (resume_id, skill_name)
);
CREATE TABLE public.job_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  tfidf_score double precision NOT NULL,
  overlap_score double precision NOT NULL,
  match_score double precision NOT NULL,
  matched_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  skill_gap double precision NOT NULL,
  readiness double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  target_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  step integer NOT NULL,
  title text NOT NULL,
  skill text,
  level text,
  kind text NOT NULL DEFAULT 'skill',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes, public.user_skills, public.job_recommendations, public.roadmaps, public.roadmap_items TO authenticated;
GRANT ALL ON public.resumes, public.user_skills, public.job_recommendations, public.roadmaps, public.roadmap_items TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resumes" ON public.resumes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own skills" ON public.user_skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own recs" ON public.job_recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own roadmaps" ON public.roadmaps FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own items" ON public.roadmap_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.skills (name, aliases, category, level) VALUES
('Python', '{python3}', 'Programming', 'Beginner'),
('Java', '{core java}', 'Programming', 'Beginner'),
('JavaScript', '{js,ecmascript}', 'Web', 'Beginner'),
('TypeScript', '{ts}', 'Web', 'Intermediate'),
('C++', '{cpp}', 'Programming', 'Intermediate'),
('C', '{}', 'Programming', 'Beginner'),
('C#', '{csharp}', 'Programming', 'Intermediate'),
('Go', '{golang}', 'Programming', 'Intermediate'),
('Kotlin', '{}', 'Programming', 'Intermediate'),
('PHP', '{}', 'Web', 'Beginner'),
('HTML', '{html5}', 'Web', 'Beginner'),
('CSS', '{css3}', 'Web', 'Beginner'),
('React.js', '{react,reactjs}', 'Web', 'Intermediate'),
('Angular', '{angularjs}', 'Web', 'Intermediate'),
('Vue.js', '{vue,vuejs}', 'Web', 'Intermediate'),
('Node.js', '{node,nodejs}', 'Web', 'Intermediate'),
('Express.js', '{express,expressjs}', 'Web', 'Intermediate'),
('Django', '{}', 'Web', 'Intermediate'),
('Flask', '{}', 'Web', 'Intermediate'),
('FastAPI', '{}', 'Web', 'Intermediate'),
('Spring Boot', '{spring}', 'Web', 'Intermediate'),
('REST API', '{rest,restful api,rest apis}', 'Web', 'Intermediate'),
('SQL', '{mysql,sql server}', 'Data', 'Beginner'),
('PostgreSQL', '{postgres}', 'Data', 'Intermediate'),
('MongoDB', '{mongo}', 'Data', 'Intermediate'),
('Pandas', '{}', 'Data', 'Intermediate'),
('NumPy', '{}', 'Data', 'Beginner'),
('Data Analysis', '{data analytics}', 'Data', 'Beginner'),
('Statistics', '{statistical analysis}', 'Data', 'Beginner'),
('Excel', '{ms excel,advanced excel,microsoft excel}', 'Data', 'Beginner'),
('Power BI', '{powerbi}', 'Data', 'Intermediate'),
('Tableau', '{}', 'Data', 'Intermediate'),
('Data Visualization', '{}', 'Data', 'Beginner'),
('Machine Learning', '{ml}', 'AI/ML', 'Intermediate'),
('Deep Learning', '{dl}', 'AI/ML', 'Advanced'),
('Natural Language Processing', '{nlp}', 'AI/ML', 'Advanced'),
('Computer Vision', '{opencv}', 'AI/ML', 'Advanced'),
('TensorFlow', '{}', 'AI/ML', 'Intermediate'),
('PyTorch', '{}', 'AI/ML', 'Intermediate'),
('scikit-learn', '{sklearn,scikit learn}', 'AI/ML', 'Intermediate'),
('Generative AI', '{genai,llm,llms}', 'AI/ML', 'Advanced'),
('Amazon Web Services', '{aws}', 'Cloud', 'Intermediate'),
('Microsoft Azure', '{azure}', 'Cloud', 'Intermediate'),
('Google Cloud', '{gcp,google cloud platform}', 'Cloud', 'Intermediate'),
('Docker', '{}', 'DevOps', 'Intermediate'),
('Kubernetes', '{k8s}', 'DevOps', 'Advanced'),
('Git', '{github,gitlab}', 'DevOps', 'Beginner'),
('Linux', '{unix}', 'DevOps', 'Beginner'),
('CI/CD', '{jenkins,ci cd}', 'DevOps', 'Intermediate'),
('Data Structures and Algorithms', '{dsa,data structures,algorithms}', 'Programming', 'Intermediate'),
('Selenium', '{}', 'Testing', 'Intermediate'),
('Manual Testing', '{software testing}', 'Testing', 'Beginner'),
('Android', '{android development}', 'Mobile', 'Intermediate'),
('Flutter', '{}', 'Mobile', 'Intermediate'),
('Figma', '{}', 'Design', 'Beginner'),
('Communication', '{communication skills}', 'Soft Skills', 'Beginner'),
('Agile', '{scrum}', 'Process', 'Beginner');

INSERT INTO public.learning_resources (skill, level, resource_name, resource_url, description) VALUES
('Python','Beginner','The Python Tutorial (official)','https://docs.python.org/3/tutorial/','Official Python language tutorial.'),
('Java','Beginner','Learn Java (dev.java)','https://dev.java/learn/','Official Java learning path from Oracle.'),
('JavaScript','Beginner','MDN JavaScript Guide','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide','Mozilla''s comprehensive JavaScript guide.'),
('TypeScript','Intermediate','TypeScript Handbook','https://www.typescriptlang.org/docs/handbook/intro.html','Official TypeScript handbook.'),
('C++','Intermediate','LearnCpp','https://www.learncpp.com/','Free structured C++ tutorials.'),
('HTML','Beginner','MDN: Learn HTML','https://developer.mozilla.org/en-US/docs/Learn/HTML','HTML basics from MDN.'),
('CSS','Beginner','MDN: Learn CSS','https://developer.mozilla.org/en-US/docs/Learn/CSS','CSS fundamentals from MDN.'),
('React.js','Intermediate','React: Quick Start','https://react.dev/learn','Official React documentation.'),
('Angular','Intermediate','Angular Tutorials','https://angular.dev/tutorials','Official Angular tutorials.'),
('Node.js','Intermediate','Learn Node.js','https://nodejs.org/en/learn','Official Node.js learning material.'),
('Django','Intermediate','Django Tutorial','https://docs.djangoproject.com/en/stable/intro/tutorial01/','Official Django tutorial.'),
('Flask','Intermediate','Flask Tutorial','https://flask.palletsprojects.com/en/stable/tutorial/','Official Flask tutorial.'),
('FastAPI','Intermediate','FastAPI Tutorial','https://fastapi.tiangolo.com/tutorial/','Official FastAPI user guide.'),
('Spring Boot','Intermediate','Spring Guides','https://spring.io/guides','Official Spring getting-started guides.'),
('SQL','Beginner','SQLBolt','https://sqlbolt.com/','Interactive SQL lessons.'),
('PostgreSQL','Intermediate','PostgreSQL Tutorial (official)','https://www.postgresql.org/docs/current/tutorial.html','Official PostgreSQL tutorial.'),
('MongoDB','Intermediate','MongoDB University','https://learn.mongodb.com/','Free official MongoDB courses.'),
('Pandas','Intermediate','Pandas Getting Started','https://pandas.pydata.org/docs/getting_started/index.html','Official pandas tutorials.'),
('NumPy','Beginner','NumPy Learn','https://numpy.org/learn/','Official NumPy learning resources.'),
('Statistics','Beginner','Khan Academy Statistics','https://www.khanacademy.org/math/statistics-probability','Free statistics & probability course.'),
('Excel','Beginner','Microsoft Excel Help & Learning','https://support.microsoft.com/en-us/excel','Official Excel training.'),
('Power BI','Intermediate','Power BI on Microsoft Learn','https://learn.microsoft.com/en-us/training/powerplatform/power-bi','Official Power BI learning paths.'),
('Tableau','Intermediate','Tableau Free Training','https://www.tableau.com/learn/training','Official Tableau training videos.'),
('Machine Learning','Intermediate','scikit-learn Tutorials','https://scikit-learn.org/stable/tutorial/index.html','Official scikit-learn tutorials.'),
('scikit-learn','Intermediate','scikit-learn User Guide','https://scikit-learn.org/stable/user_guide.html','Official scikit-learn user guide.'),
('Deep Learning','Advanced','DeepLearning.AI','https://www.deeplearning.ai/','Courses on deep learning.'),
('TensorFlow','Intermediate','TensorFlow Tutorials','https://www.tensorflow.org/tutorials','Official TensorFlow tutorials.'),
('PyTorch','Intermediate','PyTorch Tutorials','https://pytorch.org/tutorials/','Official PyTorch tutorials.'),
('Natural Language Processing','Advanced','Hugging Face NLP Course','https://huggingface.co/learn/nlp-course','Free NLP course by Hugging Face.'),
('Amazon Web Services','Intermediate','AWS Skill Builder','https://skillbuilder.aws/','Official AWS training.'),
('Microsoft Azure','Intermediate','Azure on Microsoft Learn','https://learn.microsoft.com/en-us/training/azure/','Official Azure training.'),
('Google Cloud','Intermediate','Google Cloud Skills Boost','https://www.cloudskillsboost.google/','Official Google Cloud training.'),
('Docker','Intermediate','Docker Get Started','https://docs.docker.com/get-started/','Official Docker guide.'),
('Kubernetes','Advanced','Kubernetes Tutorials','https://kubernetes.io/docs/tutorials/','Official Kubernetes tutorials.'),
('Git','Beginner','Pro Git Book','https://git-scm.com/book/en/v2','Free official Git book.'),
('Linux','Beginner','Linux Journey','https://linuxjourney.com/','Free Linux learning site.'),
('Data Structures and Algorithms','Intermediate','GeeksforGeeks DSA Tutorial','https://www.geeksforgeeks.org/dsa-tutorial-learn-data-structures-and-algorithms/','DSA tutorials popular for Indian placements.'),
('Flutter','Intermediate','Flutter Docs','https://docs.flutter.dev/get-started','Official Flutter getting started.'),
('Android','Intermediate','Android Developers Courses','https://developer.android.com/courses','Official Android courses.'),
('Figma','Beginner','Figma Learn','https://help.figma.com/hc/en-us','Official Figma help & tutorials.'),
('General','Beginner','SWAYAM (Govt. of India)','https://swayam.gov.in/','Free courses from Indian universities.');
