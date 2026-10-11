# Skill Navigator

Build the attached SkillBridge AI spec on Lovable's stack instead of the FastAPI, PostgreSQL, SQLAlchemy, and Python backend the spec names. Frontend: React, Vite, Tailwind CSS, React Router, Recharts, Lucide React icons, and Axios. Backend and data: Lovable Cloud (managed PostgreSQL) with email/password sign-up and login, plus Google sign-in. Implement resume text extraction (PDF and DOCX), TF-IDF with cosine similarity matching, skill overlap, skill gap, job readiness score, roadmap, learning resources, and roadmap progress as TypeScript server functions. Build the phases in the order the spec gives, keep the app runnable at each phase, and do not hardcode recommendation scores or skill-gap results.

Proceed without the Indian Job Market Dataset CSV for now. Keep dataset mapping pending rather than guessing at its columns; set up everything else first, and map the dataset once the CSV is provided.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a6799f4-ecbb-40c2-8bbd-3acef12bf1e9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
