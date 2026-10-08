# CRM website (Supabase, no login)

Plain HTML/CSS/JS. No build step. Upload all files to the top level of your GitHub Pages repo.

Working pages: Home (dashboard), Leads, Contacts, Deals (drag-and-drop pipeline), Tickets, Tasks, Activity log.
Greyed-out menu items open a "not built yet" guide page (soon.html).

## Setup
1. Supabase > SQL Editor: run `schema.sql` (new project) OR `remove-login.sql` (if you already ran the older schema).
2. `config.js` already holds your project URL and anon key.
3. GitHub: Settings > Pages > Deploy from branch > main / root. Open index.html.

## Warning
There is no login. Anyone who has the site address can view, change and delete the data. Use sample data only until login is added back.
