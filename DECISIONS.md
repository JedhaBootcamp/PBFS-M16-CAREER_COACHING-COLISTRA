# Decisions

**Deployed URL:** _https://…vercel.app_

**Time spent:** _…_

## 1. Plan (written before coding)

_Which tasks will you do, in which order, and why? What will you deliberately leave out? Write this before you start coding; you can add a note below if your plan changed._

| Order | Ticket | Why now |
| ----- | ------ | ------- |
| 1 | ALN-44 Charged twice | Non-negotiable. Real money lost, invisible until the monthly invoice. Must come **before** any retry logic (ALN-36), otherwise retries make it worse. |
| 2 | ALN-36 White page | Non-negotiable. Happens daily, and a white page right after *Create label* hides whether a label was bought. |
| 3 | ALN-41 Costs ×100 | A few minutes for a very visible bug that scares the accountant. |
| 4 | ALN-33 Filter & search | The most time Inès loses: every single morning, looking for problem parcels. |
| 5 | ALN-45 Safety net | Done along the way: a test with each fix, then CI green if time allows. |
| — | ALN-38 Pagination | Later: partly covered by the search in ALN-33. |
| — | ALN-29 Rate comparison | Later: biggest feature, and Inès has a workaround (the Colistra website). |

## 2. Tasks done

### ALN-__: _title_

- **What I did:**
- **Why I prioritized it:**
- **Trade-offs:**
- **How I tested it:**

_(one section per task)_

## 3. Tasks skipped

### ALN-__: _title_

- **Why I skipped it:**
- **What I would do with more time:**

_(one section per task)_

## 4. How I used AI

- **Tools:**
- **How I gave it context about the Colistra SDK:**
- **What it got wrong, and how I noticed:**
- **What I changed or rewrote myself:**
