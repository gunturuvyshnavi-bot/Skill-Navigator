<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Job matching must paginate the entire jobs table in deterministic ID order rather than rely on API row limits, so every imported posting is eligible.
- Dataset imports map only observed CSV fields; clean description markup and split comma-separated skills without inventing city, state, or employment fields.
- PDF and DOCX extraction uses Worker-compatible unpdf and fflate, so resume analysis remains deployable on Lovable Cloud.
