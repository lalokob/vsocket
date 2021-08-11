const { DH_UNABLE_TO_CHECK_GENERATOR } = require('constants');

// ❰❰❰❰❰ D E S A R R O L L O ❱❱❱❱❱
// const allowedSites = [ 'http://192.168.10.33:24700', 'http://localhost:24700' ];

// ❰❰❰❰❰ P R O D U C C I O N ❱❱❱❱❱
const allowedSites = [ 'http://192.168.10.15:7007','http://mx100-cedis-vtbbdhgjzk.dynamic-m.com:4546' ];

// ❰❰❰❰❰ P R U E B A S ❱❱❱❱❱
// const allowedSites = [ 'http://mx100-cedis-vtbbdhgjzk.dynamic-m.com:4540' ];

console.log("Reiniciado...");
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http,{ cors:{ origin:allowedSites } });

http.listen(7171, () => { console.log('listening on *:7171'); });

const counters = io.of('/counters');
const preventa = io.of('/preventa');
const resurtidos = io.of('/resurtidos');

let time = (time)=>{ return `${time.getFullYear()}-${time.getMonth()}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`; };

io.on('connection', socket =>{
    let clients = [];
    console.log("❰❰❰❰❰ Nueva conexion al socket ❯❯❯❯❯");
    console.log(socket.id);
    
    // socket.emit('socketid',{socketid:socket.id});

    // socket.on('session_start', ({profile,socketid,from}) => {
    //     console.log(`Validando conexion para ${socketid} (${socket.id})...`);

    //     socket.profile = profile.me;
    //     socket.brorigin = from;

    //     for( let [id,socket] of io.of("/").sockets){ console.log(`${socket.id} || ${id} || ${socketid}`); }
    // });

    // socket.on('list_sockets', () => {
    //     let sockets = [];
    //     for( let [id,socket] of io.of("/").sockets){
    //         console.log(socket.user);
    //         sockets.push({
    //             id,
    //             socket
    //         });
    //     }
    //     socket.emit('list_sockets', sockets);
    // });

    // socket.on('disconnect', () => {
    //     console.log("\n\n\n\n\n=============================================\n\n\n\n\n");
    //     console.log(`${socket.id} abandono el canal`);
    //     console.log("\n\n\n\n\n=============================================");
    // });

    // socket.on('on_preventa', data =>{
    //     console.log(`[${time(new Date())} GBSKT]: usuario unido a preventa.`);
    // });
});

counters.on('connection',counter=>{
    console.log("\n\n\n\n\n=============================================");
    console.log(`[${time(new Date())}]: ❰❰❰❰❰ Nueva conexion a INVENTARIOS ❯❯❯❯❯`);

    counter.on('index',gdata=>{ console.log(`[${time(new Date())}]: ${gdata.me.names} ${gdata.me.surname_pat} [${gdata.me.nick}] de ${gdata.workpoint.name} [${gdata.workpoint.alias}] ha ingresado al home de Inventarios`); });

    counter.on('joinat',gdata=>{
        let room = gdata.room;
        let user = gdata.user;

        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;

        console.log(`Uniendo a sala: ${room}`);
        counter.join(room);
        console.log(`${msg} se ha unido al ROOM: ${room}`);
        counters.in(room).emit('joined',user);
        console.log("\n=============================================");
    });

    counter.on('counting',gdata=>{
        let user = gdata.by;
        let product = gdata.product;
        let room = gdata.room;

        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;
        console.log(`${msg} esta contando un elemento`);

        counter.broadcast.to(room).emit('counting',{by:user, product:product});
    });

    counter.on('cancelcounting',gdata=>{
        // console.log(gdata);
        let user = gdata.by;
        let product = gdata.product;
        let room = gdata.room;

        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;
        console.log(`${msg} ha cancelado el conteo en el ROOM: ${room}`);
        counter.broadcast.to(room).emit('cancelcounting',{by:user, product:product});
    });

    counter.on('countingconfirmed',gdata=>{
        // console.log(gdata);
        let user = gdata.by;
        let product = gdata.product;
        let room = gdata.room;
        let settings = gdata.settings;
        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}]`;
        console.log(`${msg} ha confirmado el conteo en el ROOM: ${room}`);

        counter.broadcast.to(room).emit('countingconfirmed',{by:user, product:product, settings:settings});
    });
});

preventa.on('connection', socket =>{
    console.log("\n\n\n\n\n=============================================");
    console.log(`[${time(new Date())}]: ❰❰❰❰❰ Nueva conexion PREVENTA ❯❯❯❯❯`);
    let clients = [];    
    
    // socket.emit('socketid',socket.id);

    socket.on('join', ({ profile, workpoint, room }) => {
        let nick = profile.me.nick;
        let branch = workpoint.alias;
        let _room = `PRV_${workpoint.alias}_${room}`;

        socket.join(_room);
        socket.emit('joinedat', { profile, workpoint, room:_room });
        socket.to(_room).emit('newjoin', { profile, workpoint, room:_room });

        console.log("\n\n\n===========");
        console.log(`[${time(new Date())}]: ❯❯❯❯❯ ${nick} de ${branch} se unio a ${_room}`);
        console.log("\n\===========");
    });

    socket.on('unjoin', ({ profile, workpoint, room }) => {
        let nick = profile.me.nick;
        let branch = workpoint.alias;
        let _room = `PRV_${workpoint.alias}_${room}`;

        socket.emit('unjoined', { profile, workpoint, room:_room });
        socket.to(_room).emit('socketunjoined', { profile, workpoint, room:_room });
        socket.leave(_room);

        console.log("\n\n\n===========");
        console.log(`[${time(new Date())}]: ❯❯❯❯❯ ${nick} de ${branch} salio de ${_room}`);
        console.log("\n\n===========");
    });

    // socket.on('joinrooms', gdata => {
    //     console.log(socket.id);
    //     let branch = gdata.workpoint.alias;
    //     let rol = gdata.profile.me._rol;

    //     //ROOMS disponibles
    //     let avlrooms = [
    //         { name:'main', room:`PRV_${branch}`, auths:[1,2,3,4,5,6,7] },
    //         { name:'_sales', room:`PRV_${branch}_sales`, auths:[1,2,3,4] },
    //         { name:'_checkin', room:`PRV_${branch}_checkin`, auths:[1,2,3,4,6,7] },
    //         { name:'_warehouse', room:`PRV_${branch}_warehouse`, auths:[1,2,3,4,5,6,7] },
    //         { name:'_validation', room:`PRV_${branch}_validation`, auths:[1,2,3,5,6,7] },
    //         { name:'_cashdesk', room:`PRV_${branch}_cashdesk`, auths:[1,2,3,5] },
    //         { name:'_admin', room:`PRV_${branch}_admin`, auths:[1,2,3] },
    //     ];

    //     avlrooms.forEach( room => {
    //         if(room.auths.findIndex( auth => auth==rol )>=0){
    //             socket.join(room.room);//une al canal
    //             console.log(`${gdata.profile.me.nick} se unio a ${room.room}`);
    //             socket.emit('joinedat', {
    //                 profile:gdata.profile, workpoint:gdata.workpoint, room:room.room
    //             });//emite al mismo socket a los canales a los que se unio
    //             socket.in(room.room).emit('newjoin',{
    //                 profile:gdata.profile, workpoint:gdata.workpoint, room:room.room
    //             });
    //         }
    //     });
    // });

    socket.on('order_created', data => {
        let order = data.order.id;
        let by = data.order.created_by.nick;
        let branch = data.order.from.alias;

        console.log(`[${time(new Date())}]: ❯❯❯❯❯ ${by} de ${branch} creo el pedido ${order}!!`);
        socket.in(`PRV_${branch}_admin`).emit('order_created', data);
    });

    socket.on('order_changestate', data => {
        console.log(`[${time(new Date())}]: ❯❯❯❯❯ Una orden ha cambiado!!`);
        console.log(data);
        let order = data.order.id;
        let newstate = data.newstate;
        let branch = data.order.from.alias;

        console.log(branch);

        switch (newstate.id) {
            case 3: room = `PRV_${branch}_checkin`; break;

            case 4:
                /**
                 * 
                 * notificar al room _warehouse de un nuevo pedido (agregarlo)
                 * removerlo del room CHECKIN
                 * notificar a _admin de que una orden cambio de status
                 * 
                 */

                    socket.to(`PRV_${branch}_admin`).to(`PRV_${branch}_warehouse`).emit('order_changestate', data);
                break;
        
            default:
                    console.log("La orden cambio a un status no registrado!!");
                break;
        }

        // console.log(`La orden ${order} de ${branch} ha cambiado a ${state.name}, se notificara a ${room} `);
        // socket.in(room).emit('order_changestate',{ data });
    });

    socket.on('disconnect', data =>{
        
        console.log("\nun usuario abandono el CANAL PREVENTA\n");
    });
});

resurtidos.on('connection',dashboard=>{
    console.log("\n\n\n\n\n=============================================");
    console.log("❰❰❰❰❰ Nueva conexion a RESURTIDOS ❯❯❯❯❯");

    dashboard.on('joinat',gdata=>{
        //let roomdash = `DASHREQ-${gdata.room}`;// nombre del room a unirse
        let roomdash = `DASHBOARDSREQS`;// nombre del room a unirse
        console.log("uniendose a room "+roomdash);// 
        let user = gdata.user;
        let from = gdata.from;
        dashboard.join(roomdash);
        let msg = `${user.me.names} ${user.me.surname_pat} [${user.me.nick}] de ${user.workpoint.name} [${user.workpoint.alias}] se unio a resurtidos y al room ${roomdash}`;
        console.log(msg);

        // envia a todos en el room EXCEPTO al emisor
        // dashboard.to(roomdash).emit( 'joineddashreq', {user:user, notify:msg } );

        // envia a todos en el room, INCLUYENDO al emisor
        resurtidos.to(roomdash).emit( 'joineddashreq', { user:user, notify:msg, fromdashboard:gdata.isdashboard, from:from } );
        console.log("\n=============================================");
    });

    dashboard.on('creating',gdata=>{
        let roomdash = `DASHBOARDSREQS`;// nombre del room a unirse
        console.log("Se esta levantando un pedido");
        console.log(roomdash);
        console.log(gdata);
        resurtidos.to(roomdash).emit('creating',gdata);
    });

    dashboard.on('order_open',gdata=>{
        console.log(gdata);
        let roomdash = `DASHBOARDSREQS`;
        console.log(gdata.cmd);
        resurtidos.to(roomdash).emit('order_open',gdata);
    });

    dashboard.on('order_update',gdata=>{
        console.log(gdata);
        let roomdash = `DASHBOARDSREQS`;
        // console.log(`${gdata.profile.me.nick} abrio la orden ${gdata.order.id}`);
        resurtidos.to(roomdash).emit('order_update',gdata);
    });

    dashboard.on('order_changestate',gdata=>{
        console.log("actualizando pedido...");
        let roomdash = `DASHBOARDSREQS`;
        // console.log(`${gdata.profile.me.nick} de ${gdata.profile.workpoint.alias} ha cambiado el status de la orden ${gdata.order.id} a ${gdata.state.id} (${gdata.state.name})`);
        
        resurtidos.to(roomdash).emit('order_changestate',gdata);
    });

    dashboard.on('leave',(gdata)=>{
        // console.log(gdata);
        console.log('Saliendo de los rooms resurtidos...');
        dashboard.disconnect();
    });

    dashboard.on('disconnect',()=>{ console.log("\nun usuario abandono el canal resurtidos\n"); });
});

