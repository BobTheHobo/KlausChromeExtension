# KlausChromeExtension - declarativeNetRequest API Implementation
This implementation of declarativeNetRequest doesn't work for all cases. It works for some such as google and reddit, but fails others such as twitter. 

I've banged my head against a wall for about 3 or 4 hours trying to figure this out, but I'm pretty sure the failed cases are due to how the API handles network requests.
This, however, is hidden for the sake of privacy, meaning it's almost impossible to figure out what's going on under the hood. Maybe future updates will give
more clarity but for now I'll have to revert back to using the webRequest API.
