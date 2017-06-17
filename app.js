// A Microsoft Bot Framework template built by the Yeoman botscaffold generator
// Get App Insights going
//const appInsights = require("applicationinsights");
//appInsights.setup();
//appInsights.start();

// and other requirements
var restify = require('restify'); 
var builder = require('botbuilder'); 
const util = require('util');
require('./searchHelpers.js')();

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
intents.matches('Search', [
    function(session, results) {
    if (results.entities[0] === undefined) {
        console.log("The entity was blank :(");
        var name = "that search string";
    }
    else {
        var name = results.entities[0]["entity"];
    }

    // console.log('Entity returned is: %s', name);
    console.log('You are on the %s channel', session.message.address.channelId);
    //console.log(util.inspect(session.message));
    //console.log(util.inspect(results, false, null));
    var queryString = 'https://' + process.env.AZURE_SEARCH_NAME + '.search.windows.net/indexes/' + process.env.AZURE_INDEX_NAME + '/docs?api-key=' + process.env.AZURE_SEARCH_KEY + '&api-version=2015-02-28&' + 'search=' + name;

    performSearchQuery(queryString, function (err, result) {
        if (err) {
            console.log("Error when searching for article: " + err);
        } else if (result && result['value'] && result['value'][0]) {
            //If we have results send them to the showResults dialog (acts like a decoupled view)
            session.replaceDialog('/showResults', { result });
        } else {
            session.endDialog("No articles about " + name + " were found.");
        }
    })

    console.log(queryString);
    }
]);
intents.matches('Help', builder.DialogAction.send("Basic help information goes here."));
intents.matches('AboutTheBot', builder.DialogAction.send("I'm a chat bot, built using the botscaffold Yeoman generator."));
intents.onDefault(builder.DialogAction.send("Sorry, but I didn't understand that. Type Help to get some help."));

// show results

// bot.dialog('/showResults', [
//     function (session, args) {
//         var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
//             args.result['value'].forEach(function (article, i) {
//                 msg.addAttachment(
//                     new builder.HeroCard(session)
//                         .title(article.Title)
//                         .subtitle(article.SubTitle + " | " + "Search Score: " + article['@search.score'])
//                         // currently the db holds all body text as an array of lines, due to its JSON formatting. So, join the array and show it
//                         // need to find the correct markup for a newline char in the channels
//                         .text(article.Body.join('\n '))
//                         // .images([builder.CardImage.create(session, article.imageURL)])
//                 );
//             })
//         session.endDialog(msg);
//     }
// ])

/*bot.dialog('/showResults', [
    function (session, args) {
        var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
            args.result['value'].forEach(function (article, i) {
                msg.addAttachment(
                    new builder.HeroCard(session)
                        .title(article.Title)
                        .subtitle(article.SubTitle)
                        // db holds all body text as an array of lines, due to its JSON formatting. So, join the array and show it
                        // need to find the correct markup for a newline char in the channels
                        .text(article.Body.join('\n\n '))
                        // .images([builder.CardImage.create(session, article.imageURL)])
                        .text(article.Body + "\n Relevance:" + article['@search.score'])
                );
            })
        session.endDialog(msg);
        console.log('Message is %s: ', util.inspect(msg));
    }
])*/

bot.dialog('/showResults', [
    function (session, args) {
        args.result['value'].forEach(function (article, i) {
            var msg = ("*" + (article.Title) + "*\n\n" + (article.Body.join('\n\n') + "\n\n `Relevance: " + (article['@search.score']) +"`"));
            session.endDialog(msg);
            //session.send("Title: " + (article.Title) + "\nBody: " + (article.Body.join('\n') + "\n\n Relevance: " + (article['@search.score'])));
        })
    }
])

// web interface
server.get('/', restify.serveStatic({
 directory: __dirname,
 default: '/index.html',
}));