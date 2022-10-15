// immutable state object
let immStore = Immutable.Map({
    user: Immutable.Map({ name: 'Student' }),
    apod: '',
    rovers: Immutable.List(['Curiosity', 'Opportunity', 'Spirit']),
    currentRover: 'none'
})


// add our markup from HTML file to the page
const root = document.getElementById('root')


const updateStore = (state, newState) => {
    store = state.merge(newState)
    render(root, store)
}

// render a single HTML content on root
const render = async (root, state) => {
    root.innerHTML = App(state)
}

// Content that is added to html
const App = (state) => {
    if (state.get('currentRover') === 'none')  {
        return (`
            <header>
                <div class="navbar-flex">
                    <div class="logo-flex">
                        <a href="#"><img src="./images/home.png" onclick="goHome(event)" alt="Home icon"></a>
                    </div>
                </div>
            </header>

            <div class="home-background-container" style="background-image: url(${ImageOfTheDay(state)});">
                <div class="wrapper-buttons">
                    <h1 class="main-title">MARS ROVERS</h1>
                    <div class="button-container">${renderButtonBox(state)}</div>
                </div>
            </div>
        `)
    } else {
        // check if "currentRover" has a value and render images
        return (`
            <header>
                <div class="navbar-flex">
                    <div class="logo-flex" onclick="goHome(event)">
                       <a href="#"><img src="./images/home.png" alt="Home icon"></a>
                    </div>
                    <ul class="items-navbar">${renderMenu(state)}<ul>
                </div>
            </header>
            <div class="container-info">
                    <h1 class="title"><span>Pictures on Mars taken by ${state.get('currentRover').latest_photos[0].rover.name}</span></h1>
                    <div class="gallery">${renderImages(state)}</div>
            </div>
        `)
    }
}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, immStore)
})

// ------------------------------------------------------  COMPONENTS   ------------------------------------------------------

// Component to render div container for the rover buttons
const renderButtonBox = (state) => {
    return `<ul class="flex">${renderRoverButtons(state)}</ul>`
}

// Component to render rover buttons
const renderRoverButtons = (state) => {
    //turn Immutable List into a regular array with Array.from
    return  Array.from(state.get('rovers')).map(item =>
        `<li id=${item} class="flex-item btn" onclick="openRover(event)">
            <a ref="#"  class=""  >${item}</a>
        </li>`
        ).join("")
}

// Component to render items for the menu on the header
const renderMenu = (state) => {
    //turn Immutable List into a regular array
    return  Array.from(state.get('rovers')).map(item =>
        `<li id=${item} class="" onclick="openRover(event)">
            <a ref="#"  class=""  >${item}</a>
        </li>`
        ).join("")
}

// Component to render roverdata
const renderImages = (state) => {
    const base = state.get('currentRover');
    return Array.from(base.latest_photos).map(item =>
        `<div class="wrapper">
            <img src="${item.img_src}" />
            <div class="wrapper-info">
                <p><span>Image Date:</span> ${item.earth_date}</p>
                <p><span>Rover:</span> ${item.rover.name}</p>
                <p><span>Rover Status:</span> ${item.rover.status}</p>
                <p><span>Launch Date:</span> ${item.rover.launch_date}</p>
                <p><span>Landing Date:</span> ${item.rover.landing_date}</p>
            </div>
         </div>`
       ).slice(0, 26).join("") // display 25 most recent pictures
}

// Component renders information requested from the backend
const ImageOfTheDay = (state) => {
    if (!state.get('apod')) {
        getImageOfTheDay(state)
    } else if (state.get('apod').image.media_type === "video"){
        // fallback in case the image of the day is a video
        return `https://24wallpapers.com/app-gateway/wallpaper-uploads/wallpapers/legacyUploads/wi677f3970e20-bb0f-4321-afd7-43e37c03c8001.jpg`

    } else {
        return (`
            ${state.get('apod').image.url}
        `)
    }
}

// ------------------------------------------------------  EVENTS   ------------------------------------------------------
const openRover = event => {
    const { id } = event.currentTarget;
    // check if the id is included in rovers of the store
    if (Array.from(immStore.get('rovers')).includes(id)) {
        // get currentRover images and data from the backend
        getRoverImages(id, immStore);
    }
    else {
        console.log(`This rover does not exist`)
    }
}

// click on logo to render home page
const goHome = event => {
    // set currentRover to none to render home page
    const newState = immStore.set('currentRover', 'none');
    // update the old state with the new information
    updateStore(immStore, newState);
}



// ------------------------------------------------------  API CALLS

// Rover image API call
const getRoverImages = async (roverName, state) => {
    // set the state.currentRover to currentRover
    let { currentRover } = state
    // Get data from the server
    const response = await fetch(`http://localhost:3000/rovers/${roverName}`)
    // Convert data from the promise returned to json()
    currentRover = await response.json()
    const newState = immStore.set('currentRover', currentRover);
    // update the old state with the new information
    updateStore(immStore, newState)
    return currentRover
}

// astronomy picture of the day API call
const getImageOfTheDay = async (state) => {
    // deconstruct immutable object and isolate property apod
    let { apod } = state;
    const response = await fetch(`http://localhost:3000/apod`)
    apod = await response.json()
    const newState = immStore.set('apod', apod);
    updateStore(immStore, newState)
    return apod;
}
