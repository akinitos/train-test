### Retain original style and color scheme.
### Support animations
### Make sure web responsiveness is not neglected

### Only work in frontend MARIO, if there are changes on the backend/, write an .md file to add the plan or recommendations.

I am planning to restructure the frontend MARIO and make it look like a generic LLM website. The difference is that it is not a chatbot, The inputs are on the text box lined up horizontally along the 'send' or 'search' button. 

There should be also a standard mode and advanced mode buttons that can be changed. if standard mode, it will output a user friendly output from the backend so it is also part of the parameters on the request to the api. if advanced then it will enable the backend to do a comprehensive search and provide more data that will be outputted on the page.

There should be refresh button to clear the output from the previous prompt or search. Of course the user should be prompted if sure to refresh and recommend to download the pdf output first.

The pdf downloadable should be handled by the frontend, so it basically thansfrom the output into a downloadable pdf file.

THere should be a 'enable show accuracy'. so the dev feature is a special switch that also part of the parameters on the requests. this will tell the backend if it will use the function for comparing the actual result to the final output of the agent.


use .env and .env.example on the MARIO if needed. 