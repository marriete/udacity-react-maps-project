import React, { Component } from 'react';
import Map from './Map.js'
import FilterMenu from './FilterMenu.js'
import ListView from './ListView.js'
import './App.css';
import { Route, Link } from 'react-router-dom'
import FilterModal from './FilterModal.js'


class App extends Component {
  state = {
    locations: [
      {title: "Dunkin' Donuts", position: {lat: 39.639102, lng: -84.225591}, id: "K1G-truG2BcJLhQMFGFa5A"},
      {title: "Chick-Fil-A", position: {lat: 39.629376, lng: -84.195062}, id: "IvcTWxI_QbOx0zi4zISi_w"},
      {title: "YMCA", position: {lat: 39.665685, lng: -84.240122}, id: "Nrei_iet_uUGferoEUyOIQ"},
      {title: "Kroger", position: {lat: 39.601971, lng: -84.230185}, id: "XYsa7IbSTiASyfAudt5xVg"},
      {title: "Meijer", position: {lat: 39.67104, lng: -84.220165}, id: "CXJxtvSZwB2s3RYueMVPaA"},
      {title: "Walmart Supercenter", position: {lat: 39.630666, lng: -84.212289}, id: "QkhYR_uPqnQLsedHE96bhw"},
      {title: "Dayton Mall", position: {lat: 39.633682, lng: -84.220963}, id: "qQn0TR-opTfiX02jJnbr0w"},
      {title: "Rusty Bucket Tavern", position: {lat: 39.636468, lng: -84.221696}, id: "-2Bl3K5TtKXE3oknF_sdIw"},
      {title: "Cinemark - Dayton South", position: {lat: 39.643232, lng: -84.228703}, id: "9CiLinXhVODN0f4skzEthw"}
    ],
    yelpData: [],
    markers: [],
    filters: [],
    map: null,
    googleMarkers: [],
    infoWindows: [],
    infoWindow: null,
    checkedFilters: [],
    loaded: false,
    show: false,
    initialized: false
  }

  getYelpData = (locations) => {
    let yelpData = [];

    locations.forEach((location, index) => {
      let config = {
        headers: {'Authorization': "Bearer 1rk0i7zyjBP9sW-Ji0lLaljcswABo0q42PQRS_lTSmR2t2eicmMnyI1Ux6_nL-djivA0n1YAlm-OoIzBKY9kzhwx5MGCZzm46Qk5wQIfA0BdoplrE_LWsFJs8IbPW3Yx"},
        params: {
          id: location.id
        }
      }

      var proxyUrl = "http://localhost:8080/";
      var targetUrl = `https://api.yelp.com/v3/businesses/${config.params.id}`;

      setTimeout(() => {
        fetch(proxyUrl + targetUrl, config)
        .then(response => {
          console.log("success")
          response.json().then(data => {
            yelpData.push(data);
            this.getFilters(data);
            this.setState(yelpData)
            if (index === 8) {
              this.setState({loaded: true})
            }
          })
        })
        .catch(event => {
          console.log("failure")
        })}, 400*index);
    })

    return yelpData;
  }

  getFilters = (data) => {
    data.categories.forEach((cat) => {
      if ( !this.state.filters.includes( cat.title )) {
        this.setState({ filters: [ ...this.state.filters, cat.title ]})
      }
    });
    this.getCheckedMarkers();
  }

  toggleInit = () => {
    this.setState({initialized: true})
  }

  createMarker = (map, mark) => {
    var marker = new window.google.maps.Marker({
      position: {lat: mark.coordinates.latitude, lng: mark.coordinates.longitude},
      map: map,
      title: mark.name,
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    })

    return marker;
  }

  infoWindowListener = (content, marker, map, infoWindow) => {
    marker.addListener('click', () => {
      if(infoWindow.opened){
        if(marker.getIcon() === 'http://maps.google.com/mapfiles/ms/icons/red-dot.png') {
          window.google.maps.event.trigger(infoWindow, 'closeclick')
          infoWindow.setContent(content)
          marker.setIcon('http://maps.google.com/mapfiles/ms/icons/yellow-dot.png')
          infoWindow.open(map, marker)
          infoWindow.opened = true;
        } else {
          marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
          infoWindow.close(map, marker)
          infoWindow.opened = false;
        }
      }
      else{
        infoWindow.setContent(content)
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/yellow-dot.png')
        infoWindow.open(map, marker)
        infoWindow.opened = true;
      }
    })
    infoWindow.addListener('closeclick', function() {
      marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
      infoWindow.close(map, marker)
      infoWindow.opened = false;
    });
  }

  returnPhoneNumber = (phoneNumber) => {
    var areaCode = phoneNumber.substring(2,5);
    var prefix = phoneNumber.substring(5,8);
    var line = phoneNumber.substring(8,12);

    return areaCode + "-" + prefix + "-" + line;
  }

  showModal = () => {
    this.setState({ show: true });
  }

  hideModal = () => {
    this.setState({ show: false });
  }

  containsObject = (objectArray, newObject) => {
    let testArray = objectArray.map(obj => {
      if (obj.id === newObject.id )
        return true
      else
        return false
    })
    if (testArray.includes(true))
      return true
    else
      return false
  }

  getCheckedMarkers = () => {
    let result = [];
    if ( this.state.checkedFilters.length === 0 ) {
      result = this.state.yelpData
    } else {
      this.state.checkedFilters.forEach((filterOption) => {
        let test = null;
        test = this.state.yelpData.filter(marker => {
          let booleanArray = []
          marker.categories.forEach((cat) => {
            if (cat.title === filterOption) {
              booleanArray = [...booleanArray, true]
            } else {
              booleanArray = [...booleanArray, false]
            }
          })
          return booleanArray.includes(true)
        })
        if ( !this.containsObject( result, test[0] ) ) {
          result = result.concat( test );
        }
      })
    }
    this.setState({markers: result}, () => this.showSelectMarkers())
  }

  addGoogleMarker = (marker) => {
    this.setState((prevState) => ({
      googleMarkers: [...prevState.googleMarkers, marker]
    }))
  }

  saveMap = (map, infoWindow) => {
    this.setState({
      map: map,
      infoWindow: infoWindow
    })
  }

  checkboxChange = (e) => {
    if (e.target.checked === true) {
      this.setState({checkedFilters: [...this.state.checkedFilters, e.target.value]}, () => {this.getCheckedMarkers()})
    } else {
      let temp = []
      temp = this.state.checkedFilters.filter((option) => {
        return e.target.value !== option
      })
      this.setState({checkedFilters: temp}, () => {this.getCheckedMarkers()})
    }
  }

  hideAllMarkers = () => {
    for(let i=0; i<this.state.googleMarkers.length; i++){
      if ( this.state.googleMarkers[i].map !== null)
        this.state.googleMarkers[i].setMap(null)
    }
  }

  showSelectMarkers = () => {
    if(this.state.initialized === true) {
      this.hideAllMarkers()
      let desiredMarkers = this.filterMarkers()
      for (let i=0; i < desiredMarkers.length; i++) {
        if (this.state.googleMarkers[desiredMarkers[i]].map === null)
          this.state.googleMarkers[desiredMarkers[i]].setMap(this.state.map)
      }
    }
  }

  filterMarkers = () => {
    return this.state.markers.map((marker) => {
      for(let i=0; i < this.state.googleMarkers.length; i++) {
        if (this.state.googleMarkers[i].title === marker.name) {
          // this.state.googleMarkers[i].setMap(this.state.map)
          return i
        }
      }
    })
  }

  async componentWillMount() {
    let yelpData = await this.getYelpData(this.state.locations);
    this.setState({yelpData});
  }

  content() {
    return(
      <div className="App">
        <button className="filter-button" type="button" onClick={this.showModal}>Filters</button>
        <FilterModal show={this.state.show} handleClose={this.hideModal} changeFunction={this.checkboxChange} filters={this.state.filters} />
        <Route exact path="/" render={() => (
          <section>
            <Map
              id="map"
              options={{
                center: {lat: 39.63867, lng: -84.215963},
                zoom: 13
              }}
              createMarker={this.createMarker}
              infoWindow={this.state.infoWindow}
              infoWindowListener={this.infoWindowListener}
              returnPhoneNumber={this.returnPhoneNumber}
              markers={this.state.yelpData}
              googleMarkers={this.state.googleMarkers !== [] ? this.state.googleMarkers : null}
              addGoogleMarker={this.addGoogleMarker}
              showSelectMarkers={this.showSelectMarkers}
              saveMap={this.saveMap}
              map={this.state.map}
              initialized={this.state.initialized}
              toggleInit={this.toggleInit} />
            <Link type="button" className="to-list" to="/list">List View</Link>
          </section>
        )} />
        <Route path="/list" render={() => (
          <ListView
            markers={this.state.markers}
            returnPhoneNumber={this.returnPhoneNumber} />
        )} />
      </div>
    )
  }

  render() {
    return (
      <div className="App">
        {this.state.loaded ? this.content() : <div>Loading...</div>}
      </div>
    );
  }
}

export default App;
