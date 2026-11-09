# Opening the correct Google Maps shop pin

The Google Maps button now prioritizes the **exact shop Maps Share URL** stored under **Admin → Shop details → Exact Google Maps shop link**. The footer's address link uses the same URL.

The old site default was a broad **address search**, which can show nearby shops rather than the intended place. That old address-only link is upgraded automatically to a narrower search including the store name plus its address, but **it still cannot guarantee a specific business pin**.

To ensure customers open the correct shop:

1. On Google Maps (on your phone or browser), find **your actual Sri Sai Shanmukha Auto Centre business listing** or drop a pin at the precise shop entrance in Karimnagar. Double-check the pin is the right place, not a similarly named nearby auto store.
2. Tap **Share → Copy link**. A direct `https://maps.app.goo.gl/...` share URL or a Google Maps place-detail link is suitable.
3. Open your live shop [admin dashboard](https://sri-sai-shanmukha-auto-centre.pages.dev/admin), sign in, and select **Shop details**.
4. Paste that link into **Exact Google Maps shop link (Share → Copy link)**, click **Save business details**, then select **Check current Google Maps link** to confirm the exact place.
5. Test the site's **Open in Google Maps** button on an Android phone and iPhone (if available), and make sure it opens the correct pin. No code deploy is needed after saving in the dashboard; the setting is stored in the same D1 database used by Pages and Workers.

**Don't guess a Place ID or copy a similarly named shop's listing.** This project's published address is Kaman Chowrasta, opposite Bank of India, along the Kaman–Bus Stand road in Karimnagar, Telangana 505001. The exact Google Maps place ID or owner-verified Share URL has not yet been provided.

Google's documented place-specific URL syntax uses:
`https://www.google.com/maps/search/?api=1&query=NAME%2CADDRESS&query_place_id=PLACE_ID`
An owner-verified place ID is the strongest way to identify a particular business. If the current listing has not yet been created, use **Share → Copy link** after dropping an accurate pin, then consider creating or claiming the Google Business Profile.

References:
- https://developers.google.com/maps/documentation/urls/get-started
- https://developers.google.com/maps/architecture/maps-url
