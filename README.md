[![Stories in Ready](https://badge.waffle.io/tnocs/techradar.png?label=ready&title=Ready)](https://waffle.io/tnocs/techradar)
# Tech Radar
A tech radar that uses a [Google Sheet]

## Features

## How to use 

Not ready yet

### How it works

Build using Angularjs, there are two directives and one service:

* messagebus service: for communicating between directives.
* techradar directive: uses d3 to create the radar plot. On click, publishes a select message.
* infoslide directive: renders the technology.content as different pages, and subscribes to select message to switch technology.

