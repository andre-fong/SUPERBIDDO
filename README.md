# SUPERBIDDO

SuperBiddo is a **real-time auctioning platform** that revolutionizes the way you buy and sell trading cards. Experience the thrill of real-time auctions for individual cards or entire bundles of your favorite TCGs: Magic: The Gathering, Pokémon, and Yu-Gi-Oh! Give it a try at https://matthewsnelgrove.me/.

Built using Next.js, Express, Node, PostgreSQL, and several Google Cloud APIs.

**VIDEO DEMO HERE:** https://www.youtube.com/watch?v=88C-8YuV9DU

## Page Gallery

![image](https://github.com/user-attachments/assets/2eb3c710-1b20-4881-bd60-cf2c0dd7fae3)

![image](https://github.com/user-attachments/assets/2cc6b24c-202d-4e31-a72f-99bdefd5da82)

![image](https://github.com/user-attachments/assets/6170758f-3c6e-43d9-b733-17534fca42fc)

![image](https://github.com/user-attachments/assets/bf8c8a3f-0a70-4a97-b925-aeac79545ec1)

![image](https://github.com/user-attachments/assets/b3c250ce-1fb9-4e77-a6b5-77559129b787)

![image](https://github.com/user-attachments/assets/5edc528b-2859-4ab8-ab5e-fc344cafa862)

![image](https://github.com/user-attachments/assets/ea642165-3413-4d95-bfe9-ea48e532efd5)


## How It Was Built

### Frontend

**NAVIGATION/GENERAL:**

The frontend is built with React (TypeScript) and Next.js, utilizing Material UI components. Navigation is handled by a page setting function that accepts a page name and optional data (e.g., an auction ID for auction details). The front-end is modularized into components, with `page.tsx` serving as the primary component that dynamically renders the current page and manages a global popup container. Communication between the frontend and backend is facilitated by the JavaScript Fetch API, with all fetch requests encapsulated in `fetchFunctions.js`. In the event of a fetch error (e.g., 404, 401), an error toast is displayed with a warning (yellow) or critical (red) message, depending on the severity of the issue.

**LONG POLLING:**

When a user clicks on an auction in `auction.tsx`, a long-polling connection is established with the backend to listen for new bids. This is implemented by storing express response objects on server memory and ending the appropriate responses when a corresponding event occurs. The client-side continuously polls the server for updates, and upon receiving a new bid, the component is updated with the latest auction details, and the long-polling process restarts recursively. To ensure efficiency, the long-polling connection is terminated when the user navigates away from the auction page.

**CARD PRICE FETCHING:**

Upon uploading an image, the application leverages a Google Gemini query to extract information about the card, including its set code, name, and associated game (Magic: the Gathering, Pokemon, or Yu-Gi-Oh!). This data is then used to determine an estimated starting price for the uploaded card. We employed different external APIs for each game: Scryfall for MTG, Ygoprodeck for Yu-Gi-Oh!, and pokemontcg.io for Pokemon.

**SOCKET.IO:**

We use socket.io for incoming events from the backend, which are all notifications from the Javascript Notifications API depending on whether you get outbid, won, lost, and many more relevant events.

**RECAPTCHA:**

We used the Google Recaptcha API from Google Cloud to prevent bots from entering our site and potentially ruining the validity of our auction and bids. This ensures every bid was from a real human.

**GOOGLE MAPS API:**

We used the Maps Javascript API to fill in the location autocomplete input so that users (and us) don’t have to wonder if their location input is correct or not. We also use the Maps Embed API to render an iframe with Google Maps loaded so that the user can visualize the location they just entered.

**FRAMER MOTION:**

To render the SPA for a seamless user interaction flow, framer motion was used to animate page transitions in and out of the DOM.

### Backend

**LONG POLLING:**

The long-polling folder houses the core logic for managing long-polling connections. This code is invoked from other route handlers when a client initiates a long-polling request or an action occurs that necessitates closing existing connections. The implementation relies solely on Express, without the need for additional libraries.

**NOTIFICATIONS:**

Notifications are triggered in three scenarios: when a user places a bid, four minutes before an auction ends, and immediately after an auction concludes. Node-Scheduler is employed to schedule these events. Upon auction creation, two events are stored in a JavaScript object associated with the auction for potential future editing. When a scheduled event occurs, Socket.io is utilized to determine the user's online status. If the user is online, a notification is sent via Socket.io; otherwise, an email is dispatched using Nodemailer. This notification process is implemented as middleware, executing after `.json()` or `.sendStatus()` is called from a relevant route.

**GOOGLE GEMINI:**

When a user uploads a card image on the create auction page, the application sends the image URL (stored and hosted on Google Cloud) to a Google Gemini API query. Gemini processes the image and returns a JSON response containing details such as the card's rarity, game type (MTG, Pokemon, or Yu-Gi-Oh!), quality, and other relevant information. Due to the inherent nature of AI, there's a potential for inaccuracies in the returned data. To handle such cases, the application includes error handling mechanisms to identify and address any inconsistencies or incorrect formats in the Gemini response.

**OAUTH:**

To enable Google authentication, we integrated Google OAuth using Passport.js. When a user clicks the "Login with Google" button, they are redirected to Google's authentication page. Upon successful authentication, the user is redirected back to our application. If the user is new, a new user account is created in our database.

**GOOGLE MAPS API:**

On the backend, we use the Places API to process and transform the `placeId` sent by the client on every request they make to edit their own location. We transform this `placeId` into a formatted address and longitude/latitude coordinates to store in our database.

**CSRF:**

As our frontend and backend are deployed on separate domains, we've configured our session cookies to have a `SameSite` attribute of `None` to enable cross-site communication. To mitigate the increased risk of CSRF attacks associated with this configuration, we've implemented several protective measures.

We've adopted the Double Submit Cookie pattern, leveraging the `csrf-csrf` package. This approach involves sending a CSRF token in both a cookie and a custom header with each request. The backend then validates these tokens to ensure the request originates from our frontend.

Additionally, we've implemented CORS configuration to restrict responses to specific origins. While CORS effectively prevents unauthorized responses, it doesn't fully safeguard against non-safe requests (e.g., POST, PUT, DELETE) that could potentially modify state. To address this, we've incorporated the `csrf-csrf` middleware to enforce the presence of the CSRF token header for non-safe requests. This ensures that only legitimate requests from our frontend can modify server-side state.

**IMAGES:**

To enhance scalability and simplify management, we've opted to store images on Google Cloud Storage instead of our virtual machines. Images can be uploaded via an Express endpoint. To optimize storage usage and reduce costs, images are scheduled for automatic deletion after 24 hours unless they're associated with a card or bundle. Google Cloud Storage's Object Lifecycle Management feature automates this process, eliminating the need for manual tracking and batch deletion jobs.

**SESSIONS:**

We utilize `express-session` to manage user sessions. To optimize server memory usage and ensure session persistence in the event of server crashes, we've opted to store session data in our database. While an in-memory store like Redis could offer faster access times, our current VM configuration with limited memory constraints necessitates the use of database storage. In the future, as our application scales, we may consider migrating to a more performant in-memory storage solution.

**OPENAPI:**

We've adopted OpenAPI to comprehensively document our API. This standardized approach simplifies the integration between our frontend and backend by clearly defining expected inputs and outputs. Additionally, we've integrated Express-OpenAPI-Validator to enforce API contract validation. By aligning our API implementation with the OpenAPI specification, we've significantly reduced the likelihood of bugs and unpredictable behavior that often arise from discrepancies between documentation and actual functionality.

### Deployment

We deployed our containerized frontend, backend, and database on a Google Cloud VM. We used dockerfiles to build images for the frontend and backend from our source code. We used a nginx-proxy to forward traffic between clients and our application. We also used a let’s encrypt companion to manage SSL certificates on our site. Finally, we used a postgres image to run our database on the VM. We created a bash script to automate the build and deploy process which builds the frontend and backend images locally, uploads them to the VM, copies the environment files, `docker-compose` file, and other secret credentials to the VM. It then starts the images in the docker compose on the server. We registered the matthewnelgrove.me domain and set up DNS for matthewsnelgrove.me, backend.matthewsnelgrove.me, and database.matthewsnelgrove.me. We configured firewall settings on the VM to allow http traffic to flow through the VM.

## Challenges

### Notifications

Initially, we focused on implementing bid notifications. However, as the project progressed, we expanded the scope to include auction-ending notifications. This decision presented challenges, as some notifications could be grouped together, while others necessitated additional complexity or significant data retrieval from the backend.

While we initially considered long polling as a potential solution, we ultimately opted for WebSockets using Socket.io. Long polling was deemed insufficient for handling multiple (eight) notification events efficiently.

We invested considerable effort in learning and implementing Socket.io on both the frontend and backend. Additionally, we had to devise a reliable method for scheduling events, as we couldn't rely on a global array due to the possibility of auction rescheduling.

### Long Polling

Firstly, we had to learn the flow of how long polling takes place since it was different from the standard fetch and wait for a response. We initially created a system where we would save the res object for everyone involved in an auction and then whenever someone bids we would loop over that and send those people the response.

We later optimized our algorithm. We have query parameters to indicate if the client wants to long poll instead of getting the current data. Upon receiving this request, we save the express response object associated with the id of the auction they are polling for. Then, when an update to the auction happens the client receives the up-to-date information. When testing in the deployed version we realized that requests timeout after 1 minute by default on our nginx configuration. We then made the decision to set a 40-second timeout in express which would send the current data back to the client if no changes have occurred yet. We considered letting requests timeout and handling the timeout error in the frontend to resend the request, but this would have required configuring cors on the nginx proxy, and more logic for the error handling case compared to just receiving a normal response.

### Recommendations

As many online marketplaces do, we wanted a method of recommending auctions to our users to make auction discovery and interaction easier. We initially explored the possibility of leveraging Google Gemini to generate personalized auction recommendations based on user data and available listings. However, after careful consideration, we decided to prioritize using Gemini for a more immediate and impactful application: enhancing the auction creation process. By utilizing Gemini's image analysis capabilities, we were able to extract card information from user-uploaded images, streamlining the process and improving user experience.

To tackle the new recommendations problem, we first had to figure out how to track user data and exactly what we care about tracking. For every auction a user clicks on (views) or bids on (meaningful interaction), we stored these actions in the database for later use. We decided that the price range and game of each auction interacted with were the most important datapoints to keep track of.

To transform the user action data into meaningful recommendations, we designed an algorithm to first weigh each user action (e.g., bidding on an auction would be weighed heavier than simply viewing one) to determine how many auctions of each game or price to return as recommendations. Then, we would fetch the according amount of auctions of game x and price range y and limit the amount to 10. Finally, we loosened the parameters so that users with not too many user actions stored so far can get equally predictive and ample suggestions based on the small amount of auctions they’ve interacted with thus far. This would be rendered on the home page based on whether the user was logged in or not.

## Credits

Made with love by [Andre](https://github.com/andre-fong/), [Victor](https://github.com/zayleak), and [Matthew](https://github.com/MatthewSnelgrove).

CSCC09 Final Project.
