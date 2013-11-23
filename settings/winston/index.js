winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    prettyPrint: true
});
