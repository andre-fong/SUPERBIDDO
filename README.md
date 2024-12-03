[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/DnqlZtdt)

Project Description:

Provide a detailed description of your app

Superbiddo is a premier online trading card auction platform for collectors and players. It offers a seamless, real-time auction marketplace where users can buy and sell individual cards or bundles—such as packs of cards—in a dynamic real-time auction-style format. We support three major trading card games: Magic: The Gathering, Pokémon, and Yu-Gi-Oh!

Deployed App Link:
https://matthewsnelgrove.me/

Youtube Video:
https://www.youtube.com/watch?v=Grw7cSrQrV0

Development:
Leaving deployment aside, explain how the app is built. Please describe the overall code design and be specific about the programming languages, framework, libraries and third-party api that you have used.

The frontend and backend are separated into two folders, the names frontend and backend, respectively.

Frontend:

NAVIGATION/GENERAL:
The front end is built on React (TypeScript) w/ Next.js and uses Material UI components. To navigate through pages we have a page setting function that takes the page name and potential data the page might need (For instance when you click on an auction it needs the auction ID). The front end is split into multiple components with page.tsx being the mage pain handler (Always visible since the app is an SPA) that decides what page is visible that also contains the popup container. We also use Javascript fetch API to communicate between the front end and back end. All of our fetch requests are located in fetchFunctions.js. If the fetch request were to get an error (Ex. 404, 401, etc.) then an error toast would popup with either a type warning (yellow) or critical (red) message, depending on the severity of the error.

LONG POLLING:
Located when you click on an auction (auction.tsx) the user substantiates a connection and waits on the backend for a new bid from a user. If a new bid is placed, then the long poll restarts by recursively calling itself whilst updating the component with the new auction details. We just used the Javascript API for this. Whenever the user leaves the page the long polling is aborted.

CARD PRICE FETCHING:
Whenever the user uploads an image, a Google Gemini query is called from a route and retrieves data about the set code, name, and game (Magic, Pokemon, and Yugioh). This is then used to generate an estimated starting price for the uploaded card. We call a different API depending on the game: Scryfall API for MTG, Ygoprodeck API for Yugioh, and pokemontcg.io API for Pokemon.

SOCKET.IO:
We use socket.io for incoming events from the backend, which are all notifications (from the Javascript Notifications API) depending on whether you get outbid, won, lost, and many more.

RECAPTCHA:
We used the Google Recaptcha API from Google Cloud to prevent bots from entering our site and potentially ruining the validity of our auction and bids. This ensures every bid was from a real human.

GOOGLE MAPS API:
We used the Maps Javascript API to fill in the location autocomplete input so that users don’t have to wonder if their location input is correct or not. We also use the Maps Embed API to render an iframe with Google Maps loaded so that the user can visualize the location they just entered.

FRAMER MOTION:
To render the SPA for a seamless user interaction flow, framer motion was used to animate page transitions in and out of the DOM

Backend:

CONFIGURATION
The config services folder contains config files for various high-level configurations for tools used by other files. For example, configuring a database client object to make queries in route handlers, creating a bucket object to make requests to google cloud storage, and configuring a csrf middleware and route to generate tokens.

LONG POLLING
The long polling folder sets up a long polling interface to create new long poll requests, add pending clients, and close requests. This code is called in other route handlers where the request indicates the client wants to long poll, or an action happens which should cause requests to be closed. Long polling did not use any additional packages - just specially handled express requests.

NOTIFICATIONS:
The notifications happen whenever you post a bid, an auction is about to end (4 mins before it ends) and when it ends. We use node-scheduler to schedule these events. Whenever the user creates an auction a 2 new events are stored (using a Javascript object) under that auction incase the user ever wants to edit the auction. Whenever the timed events fire we use socket.js to check if the user is online and if they are we send them a notification (via sockets as mentioned previously) and if not an email via nodemailer. Also finally to note that these happen via a middle ware function after either a .json() is called or .sendStatus() from a given route with the middleware.

GOOGLE GEMINI:
Whenever the user uploads a card from the create auction page gemini will fill in details about that card. In that request the API sends a imageurl which is a url uploaded to our google cloud. The code then attaches that email and retrieves data about the cards rarity, game type (MTG, Pokemon, Yugioh), quality and many more from a long gemini query. It then sends back the data in JSON format. Since this is AI it can some times mess up the output (Ex. not giving in the proper format) so we throw an error in case this happens.

OAUTH
We set up OAuth so that everytime the user clicks the google login/signup button then it links them to the oauth page. Once the user is authenticated it sends them to the main page with the user stored/created. This is done with google strategy and passport.

GOOGLE MAPS API:
On the backend, we use the Places API to process and transform the placeId sent by the client on every request they make to edit their own location. We transform this placeId into a formatted address and long/lat coordinates to store in postgres.

CSRF
Since we have our frontend and backend deployed on separate domains, we had to set samesite to none to send our session cookie to the backend. This makes our site vulnerable to csrf attacks so we built preotctions for this. We used the csrf-csrf package to implement double submit cookie pattern csrf protection. Although cors configuration prevents responses from being sent, non-safe requests may modify state fraudulently. To protect against this, we used the middleware form csrf-csrf before routes to ensure that non-safe requests will be blocked unless the request contains a x-csrf-token header with a value matching the cokie value.

IMAGES
We chose to store images in google cloud storage instead of on our vm to have a slightly more managed experience and possibly scale with support should our site grow. Images can be uploaded via an express endpoint but are scheduled to be deleted automatically, unless they are later attached to a card or bundle within the next 24 hours. This configuration was made simpler by using google cloud storages object lifecycle management to schedule images for deletion instead of implementing some tracking and batch deletion job manually.

SESSIONS
We used express-session to control our session management. We stored session data in our database to reduce server memory usage and persist sessions in the event of server crash. In the future we may want to investigate using an memory store like redis to have the data more accessible, but given our very limited vm memory under our cheap vm configuration, we chose to store it in the database.

OPENAPI
We used openapi to document the api. This made connecting the frontend and backend much simpler and less confusing as it clearly defined the expected input and output t the api. We also used the doc to do user input validation using express-openapi-validator. This ensured that the documentation actually matched the behaviour which is an all too common and frustrating experience for developers and a massive source of bugs and unpredictable behavior.

Deployment:
Deployment
Explain how you have deployed your application.
We deployed our containerized frontend, backend, and database on a google cloud vm. We used dockerfiles to build images for the frontend and backend from our source code. We also used a nginx-proxy to forward traffic between clients and our application. We also used a let’s encrypt companion to manage ssl certificates on our site. Finally, we used a postgres image to run our database on the vm. We created a bash script to automate the build and deploy process which builds the frontend and backend images locally, uploads them to the vm, copies the environment files, docker-compose file, and other secret credentials to the vm. It then starts the images in the docker compose on the server. We registered the matthewnelgrove.me domain and set up DNS for matthewsnelgrove.me, backend.matthewsnelgrove.me, and database.matthewsnelgrove.me. We configured firewall settings on the vm to allow http traffic to flow through the vm.

Challenges:

Notifications:

Firstly there was the task of actually figuring out which events we wanted from notifications. At first we just talked about having only bid events but later we then discussed auction ending events. The problem with this is that some of these could be grouped together in the same event (fired at the same time) and others required an extra layer of complexity (auction ending events) or retrieving way more things from the backend. After we settled on these ideas, we were originally deciding on only having long polling because thats what we used for the real time auction, however, the more and more that we discussed it we realized that sockets would be way better. Long polling would only be good for one event listening and we have multiple (8) notification events that could happen. We then had to learn how to properly setup socket.js with the frontend and backend. There was also the task of figuring out how to time events properly since we had no idea how to schedule events. We did not want to have basically a giant global array that held all of our node scheduler events but there was no way around it since the auction dates can be rescheduled.

Long polling:

Firstly, we had to learn the flow of how long polling takes place since it was different from the standard fetch and wait for a response. We initially created a system where we would save the res object for everyone involved in an auction and then whenever someone bids we would loop over that and send those people the response.

We later optimized our algorithm. We have query param to indicate if the client wants to long poll instead of getting the current data. Upon receiving this request, we save the express response object associated with the id of the auction they are polling for. Then, when an update to the auction happens the client receives the up-to-date information. When testing in the deployed version we realized that requests timeout after 1 minute by default on our nginx configuration. We then made the decision to set a 40-second timeout in express which would send the current data back to the client if no changes have occurred yet. We considered letting requests timeout and handling the timeout error in the frontend to resend the request, but this would have required configuring cors on the nginx proxy, and more logic for the error handling case compared to just receiving a normal response.

Recommendations

As many online marketplaces do, we wanted a method of recommending auctions to our users to make auction discovery and interaction easier. At first, we aimed to use Google Gemini to generate a list of recommended listings by constantly supplying it with context on user data we track and the listings we have available in our system. However, after further research and trials, we determined this to not be the smartest way to implement recommendations and decided to use Gemini to generate card info from the user-uploaded image to enhance the auction creation process for ease of use.
To tackle the new recommendations problem, we first had to figure out how to track user data and exactly what we care about tracking. For every auction a user clicks on (views) or bids on (meaningful interaction), we stored these actions in the db for later use. We decided that the price range and game of each auction interacted with were the most important datapoints to keep track of.
To transform the user action data into meaningful recommendations, we designed an algorithm to first weigh each user action (e.g., bidding on an auction would be weighed heavier than simply viewing one) to determine how many auctions of each game or price to return as recommendations. Then, we would fetch the according amount of auctions of game x and price range y and limit the amount to 10. Finally, we loosened the parameters so that users with not too many user actions stored so far can get equally predictive and ample suggestions based on the small amount of auctions they’ve interacted with thus far. This would be rendered on the home page based on whether the user was logged in or not.

Contributions:

Victor:

- Create auction page
- Gemini upload route and gemini query
- All of notifications and email events
- All of the watching auctions routes
- Watch auctions page
- OAuth configuration
- reCaptcha
- All of your biddings page (excluding the routes)
- All of your listings page (excluding the routes)
- Connecting the long polling on the auction page
- Toast error handling

Matthew Snelgrove:

- All deployment
- All database design, setup, tables, etc.
- Backend setup
- High level design
- Error handling
- Configuration
- Cors, sessions, db, etc.
- Npm scripts
- Types
- Long polling backend
- Express routes
- Accounts, auctions, bids, images, session
- Google cloud storage (images)
- Openapi doc

Andre Fong:

- Page designs and implementations for the home page, search page, auction page, navbar, footer, login/signup page, edit location page, and skeleton loading states
- Recommendations: figure out how to store user data, what to store, and design an algorithm to transform this data into meaningful \* recommendations for the user
- Extensive styling with css, styled MUI components, and MUI themes
- Main page router for rendering different pages in an SPA
- Seamless page transition UI flow using Framer Motion
- Use Google Maps APIs and services to support editing locations and rendering them on appropriate pages
- Manage the form state of the robust search filtering system in search results
- POC for connecting long polling into the auction page
