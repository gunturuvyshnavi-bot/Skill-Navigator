# Imported job dataset

Source: `jobs_dataset_verified.csv`, 15,000 postings.

| CSV field | Application field |
| --- | --- |
| title | job_title |
| companyName | company |
| tagsAndSkills | required_skills (comma-separated values, trimmed) |
| experience | experience |
| salary | salary |
| location | location |
| jobDescription | job_description (HTML markup removed, entities decoded) |

Stable SHA-256 external identifiers identify imported records. All 15,000 identifiers are distinct. Three source descriptions are empty and remain empty; no descriptions are fabricated. City, state, and employment type were not supplied and remain unset.

Matching paginates the complete dataset in deterministic ID order, rather than truncating at the API's row cap. Scores are calculated from resume text and skill overlap, never supplied as sample values.

Dataset tags are retained as provided; some are broad terms rather than technical skills. This can affect extracted skills and learning priorities. Future taxonomy cleanup should use an explicit reviewed mapping rather than silently inventing skill labels.