# Backlog: Atelier Lune shipping dashboard

Seven open tickets. They're listed by ticket number, **not by priority**. Each one describes what Inès experiences, not what's wrong in the code. Finding the cause is part of the job.

---

## ALN-29: Compare carriers before buying a label

**Reported by:** Inès

**What happens today:** every label is bought from Colissimo. The *Compare rates* button next to each order doesn't do anything. To find a cheaper or faster option, Inès opens the Colistra website in another tab, compares the prices by hand, and comes back.

**What Inès needs:** for any order waiting for a label, see the available carriers side by side, with their **price** and **estimated delivery time**, quickly spot the **cheapest** and the **fastest**, pick one, and buy the label with that carrier.

---

## ALN-33: Find problem parcels and specific orders quickly

**Reported by:** Inès

**What happens today:** there's no way to narrow down the shipments list. Inès scrolls through it looking for red *Problem* badges every morning, and she's never sure she has seen them all. When a customer calls about order AL-10042, she has no quick way to find its parcel.

**What Inès needs:**

- Show only the shipments with a given status, *Problem* first and foremost.
- Search a shipment by its order number (typing `10042` or `AL-10042` should find it).

---

## ALN-36: The page sometimes goes white

**Reported by:** Inès

**What happens today:** now and then, the dashboard turns into a blank white page. It happens more on busy mornings, when she clicks quickly through several shipments. She reloads until it works. Once it happened right after she clicked *Create label*, and she couldn't tell whether the label had been bought.

**What Inès needs:** the dashboard never goes blank. When something fails, she sees a clear message in plain language (what happened, and what she can do), and the app recovers by itself when it reasonably can.

---

## ALN-38: Older shipments are missing

**Reported by:** Inès

**What happens today:** the shipments page only shows the most recent parcels. Anything older seems to have disappeared. Last week a customer asked about an order from 10 days ago and Inès couldn't find it in the dashboard.

**What Inès needs:** access to all the shipments, not just the latest ones.

---

## ALN-41: Absurd shipping costs on the shipments page

**Reported by:** Inès (and the accountant, who panicked)

**What happens today:** the *Cost* column on the shipments page shows amounts like `2030.00 €` for a Chronopost parcel. The detail panel and the Colistra invoice show much smaller amounts.

**What Inès needs:** the right amounts, formatted the same way everywhere in the dashboard.

---

## ALN-44: Charged twice for the same label

**Reported by:** Inès

**What happens today:** Colistra's monthly invoice contains several pairs of labels for the same order. Inès thinks it happens when she clicks *Create label* and nothing seems to happen, so she clicks again. It may also happen when the connection is bad. Each extra label is real money, and nobody notices until the end of the month.

**What Inès needs:** a label for a given order is bought **once**, whatever happens: double click, slow network, error, retry. This is a non-negotiable requirement (see `BRIEF.md`).

---

## ALN-45: The safety net is broken

**Reported by:** the founders

**What happens today:** GitHub Actions is red on every push, so nobody looks at it anymore. One unit test fails. The end-to-end test suite is an empty shell: it only checks that the orders page has a title. The next developer who touches the label flow could break it without anyone knowing.

**What we need:**

- CI is green again, for the right reasons (fix the causes; don't delete or skip the checks).
- At least one meaningful end-to-end test of what matters most to Inès.
- Tests for whatever you change.
