const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('Mongodb connected....');

    //connect to socket.io
    client.on('connection', function(socket){
        //creating a collection 
        let chat = db.collection('chats');

        //create function to send status
        sendStatus = function(s){
            socket.emit('status', s);//whenever we want to pass something from our server to our client to the index.html file we use .emit()
        }

        //get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }
            //emit the messages
            socket.emit('output', res);
        });
        //handle input events like when someone on client types in message and sends it                    
        socket.on('input', function(data){
            //client will be dealing with 2 values name and message
            let name = data.name;
            let message = data.message;

            //check for name and message
            if(name == '' || message == ''){
                //send err status
                sendStatus('Please enter a name and message');
            } else {
                //insert message
                chat.insert({name: name, message: message}, function(){
                    //emitting the output back to client
                    client.emit('output', [data]);

                    //send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        //handle clear
        socket.on('clear', function(data){
            //remove all chats from collection
            chat.remove({}, function(){
                 //emit cleared
                 socket.emit('cleared');
            });
        });
    });
});
