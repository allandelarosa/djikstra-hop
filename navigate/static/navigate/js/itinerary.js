let detailsRetrieved;

async function createItinerary(places, ids) {
    // reset details
    detailsRetrieved = new Set();

    // set title
    $('#search-title').text('Your Itinerary');

    $('#search-results')[0].scrollTop = 0;
    $('#search-results').hide().empty();

    let index = 1;
    for (let id of ids) {
        for (let place of places) {
            if (place.place_id === id) {
                $('#search-results').append(await createItineraryEntry(place, index++));
                break;
            }
        }
    }
}

async function createItineraryEntry(place, index) {
    return $('<li>').attr('id', place.place_id).append(
        // info
        $('<div>').addClass('info-container').append(
            // name
            $('<div>').addClass('search-result-title').append(
                $('<strong>').text(`${index}. `),
                $('<strong>').text(place.name).addClass('clickable-title'),
            ),

            $('<div>').addClass('place-info hidden').append(
                // ratings
                place.rating ? $('<div>').append(
                    // rating number
                    $('<div>').text(`${place.rating} `).css('color', ' #fb0'),
                    // star rating
                    $('<div>').addClass('Stars').css('--rating', `${place.rating}`),
                    // number of ratings
                    $('<div>').text(`(${place.user_ratings_total})`).css('color', ' #ccc'),
                ).addClass('ratings-container') : $(),

                // price level and address
                $('<div>').html(() => {
                    let info = ''
                    // get price level
                    if (place.price_level) {
                        let price_level = place.price_level;
                        while (price_level-- > 0) info += '$';

                        info += ' &#183; ';
                    }

                    // get address
                    info += place.vicinity.split(',')[0];

                    return info;
                }),

                // opening hours (deprecated)
                // place.opening_hours ? (
                //     place.opening_hours.open_now ?
                //         $('<div>').text('Open now').css('color', 'green') :
                //         $('<div>').text('Closed').css('color', 'red')
                // ) : $(),
            ).hide(),
        ),
        // picture
        place.photos ? $('<div>').append(
            $('<img>').addClass(
                (place.photos[0].width > place.photos[0].height ? 'wide-photo' : 'long-photo'), 'result-photo'
            ).attr('src', place.photos[0].getUrl())
        ).addClass('photo-container hidden').hide() : $(),
    ).hover(
        // highlight corresponding markers when hovering
        () => { highlightMarker(markers[place.place_id]) },
        () => { unhighlightMarker(markers[place.place_id]) },
    ).click(() => {
        expandItineraryEntry(place.place_id);
    });
}

async function expandItineraryEntry(id) {
    // get additional details if not already
    if (!detailsRetrieved.has(id)) {
        await getAdditionalInfo(id);
    }

    // if another element expanded, unexpand it first
    unexpandItineraryEntry($('.itinerary-entry-expanded').attr('id'));

    // swap listener from li to title
    $(`#${id}`).off('click').toggleClass('itinerary-entry-expanded').click(() => {
        scrollResults(id);
    });
    $(`#${id} .clickable-title`).click((event) => {
        event.stopPropagation();
        unexpandItineraryEntry(id);
    });

    // grow for info
    $(`#${id} .place-info`).animate({ height: 'toggle', 'margin-top': 'toggle' }, () => {
        scrollResults(id);
    });

    $(`#${id} .photo-container`).animate({height: 'toggle'});

    // fade in elements
    $(`#${id} .hidden`).animate({ opacity: '1' });
}

async function unexpandItineraryEntry(id) {
    // if nothing was expanded, do nothing
    if (!id) return;

    // swap listener from title to li
    $(`#${id} .clickable-title`).off();
    $(`#${id}`).off('click').toggleClass('itinerary-entry-expanded').click(() => {
        expandItineraryEntry(id);
    });

    // fade out elements
    $(`#${id} .hidden`).animate({ opacity: '0' });

    // shrink space
    $(`#${id} .photo-container`).animate({height: 'toggle'});

    $(`#${id} .place-info`).animate({ height: 'toggle', 'margin-top': 'toggle' });
}

async function getAdditionalInfo(id) {
    const request = {
        placeId: id,
        fields: [
            'business_status',
            'formatted_phone_number',
            'utc_offset_minutes',
            'opening_hours',
            'url',
            'website',
        ],
    };

    detailsRetrieved.add(id);

    await service.getDetails(request, (place, status) => {
        if (status !== 'OK') return;

        $(`#${id} .place-info`).append(
            // opening hours 
            place.opening_hours ? (
                place.opening_hours.isOpen() ?
                    $('<div>').text('Open now').css('color', 'green') :
                    $('<div>').text('Closed').css('color', 'red')
            ) : $(),

            // phone number
            place.formatted_phone_number ?
                $('<div>').append(
                    $('<div>').append(
                        $('<i>').addClass('fa fa-phone info-icon'),
                    ), 
                    $('<div>').text(place.formatted_phone_number),
                ).addClass('additional-info') : $(),

            // website
            place.website ? $('<div>').append(
                $('<a>').append(
                    $('<div>').append(
                        $('<i>').addClass('fa fa-globe info-icon'),
                    ), 
                    $('<div>').text('Visit website'),
                ).attr({href: place.website, target: '_blank', title: place.website}).addClass('btn btn-link additional-info'),
            ) : $(),

            // google maps link
            $('<div>').append(
                $('<a>').append(
                    $('<div>').append(
                        $('<i>').addClass('fa fa-external-link info-icon'),
                    ), 
                    $('<div>').text('View on Google Maps'),
                ).attr({href: place.url, target: '_blank', title: place.url}).addClass('btn btn-link additional-info')
            ),
        );
    });
}