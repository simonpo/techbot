// A Microsoft Bot Framework template built by the Yeoman botscaffold generator
// Get App Insights going
const appInsights = require("applicationinsights");
appInsights.setup();
appInsights.start();

// and other requirements
var restify = require('restify'); 
var builder = require('botbuilder'); 

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.PORT || 3978, function() 
{
   console.log('%s listening to %s', server.name, server.url); 
});

// Create the bot
var connector = new builder.ChatConnector({
    appId: process.env.MY_APP_ID,
    appPassword: process.env.MY_APP_PASSWORD
})
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Add LUIS recognizer
var recognizer = new builder.LuisRecognizer(process.env.MY_LUIS_MODEL);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Create bot dialogs
bot.dialog('/', intents);
intents.matches('Greeting', builder.DialogAction.send('Hello'));
intents.matches('Help', builder.DialogAction.send("Basic help information goes here."));
intents.matches('AboutTheBot', builder.DialogAction.send("I'm a chat bot, built using the botscaffold Yeoman generator."));
intents.onDefault(builder.DialogAction.send("Sorry, but I didn't understand that. Type Help to get some help."));

// web interface
server.get('/', restify.serveStatic({
 directory: __dirname,
 default: '/index.html',
}));