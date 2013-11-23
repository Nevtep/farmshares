define(["simpleCart"], function (simpleCart) {
    var plainWrite = simpleCart.writeCart;
    var groupedWrite = function (selector) {
        var TABLE = settings.cartStyle.toLowerCase(),
						isTable = TABLE === 'table',
                        CAPTION = isTable ? "caption" : "div",
						TR = isTable ? "tr" : "div",
						TH = isTable ? 'th' : 'div',
						TD = isTable ? 'td' : 'div',
						cart_container = simpleCart.$create(TABLE),
                        group_container = simpleCart.$create(CAPTION).addClass('groupRow'),
						header_container = simpleCart.$create(TR).addClass('headerRow'),
                        footer_container = simpleCart.$create(TR).addClass('footerRow'),
						container = simpleCart.$(selector),
						column,
						klass,
						label,
						x,
						xlen;


        var addGroup = function (group) {
            cart_container.append(group_container);

            cart_container.append(header_container);
            // create the group      
            group_container.append(
							simpleCart.$create("h2").html(group)
						);

            // create header
            for (x = 0, xlen = settings.cartColumns.length; x < xlen; x += 1) {
                column = cartColumn(settings.cartColumns[x]);
                klass = "item-" + (column.attr || column.view || column.label || column.text || "cell") + " " + column.className;
                label = column.label || "";

                // append the header cell
                header_container.append(
							simpleCart.$create(TH).addClass(klass).html(label)
						);
            }

            var filter = {};
            filter[settings.groupBy] = group;
            var subtotal = 0;
            // cycle through the items
            simpleCart.find(filter, function (item, y) {
                subtotal += item.total();
                simpleCart.createCartRow(item, y, TR, TD, cart_container);
            });

            cart_container.append(footer_container);
            var footerLabel = settings.labelGroupFooter ? group + " Farm Total: " : "Farm Total: ";
            footer_container.append(
                simpleCart.$create("span").html(footerLabel).append(
                     simpleCart.$create("span").html(simpleCart.toCurrency(subtotal)).addClass("subtotal")
                )
            );
        }

        container.html(' ').append(cart_container);

        simpleCart.each(settings.groups, function (group, index) {
            addGroup(group);
        });

        return cart_container;
    }

    // Default setting
    simpleCart({
        groups: [],
        labelGroupFooter: true
    });

    var afterAdd = function (item, isNew) {
        if (isNew) {
            var group = item.get(settings.groupBy)
            if (settings.groups.indexOf(group) == -1)
                settings.groups.push(group);
        };
    };

    simpleCart.bind("afterAdd", function (item, isNew) {
        afterAdd.apply(simpleCart, item, isNew);    
    });

    var writeCart = function (selector) {
            if (!settings.groupBy)
                groupedWrite.apply(this, selector);
            else
                plainWrite.apply(this, selector);
        };

    simpleCart.extend({
        writeCart: function (selector) {
            writeCart.apply(simpleCart,selector);
        }
    });
});