---
title: Auth signatures
layout: channels.njk
eleventyNavigation:
  parent: Library auth reference
  key: Auth signatures
  title: Authentication signatures
  order: 1
---

# Generating the authentication string

This guide is designed for library makers who wish to implement the signing mechanism in use by [private channels](/docs/channels/using_channels/private-channels). Visit that page for information about integration and an overview of the technique.

The auth string should look like

```json
<pusher-key>:<signature>
```

The signature is a HMAC SHA256 hex digest. This is generated by signing the following string with your Channels secret

```json
<socket_id>:<channel_name>
```

## Worked Example

Suppose that you have the following Channels credentials

```json
key = '278d425bdf160c739803' secret = '7ad3773142a6692b25b8'
```

And the user has connected and Channels has assigned that user with a `socket_id` with the value `1234.1234`.

Given that your application receives a POST request to `/pusher/auth` with the parameters

```json
(channel_name = (private - foobar) & socket_id = 1234.1234)
```

You would first check that the user (authenticated via cookies or whatever) has permission to access channel `private-foobar`. If she has permission you would create a HMAC SHA256 hex digest of the following string using your secret key

```json
1234.1234:private-foobar
```

Using Ruby as an example

```rb
require "openssl"

digest = OpenSSL::Digest::SHA256.new
secret = "7ad3773142a6692b25b8"
string_to_sign = "1234.1234:private-foobar"

puts signature = OpenSSL::HMAC.hexdigest(digest, secret, string_to_sign)
# => 58df8b0c36d6982b82c3ecf6b4662e34fe8c25bba48f5369f135bf843651c3a4
```

The auth response should be a JSON string with a an `auth` property with a value composed of the application key and the authentication signature separated by a colon ':' as follows:

```json
{
  "auth": "278d425bdf160c739803:58df8b0c36d6982b82c3ecf6b4662e34fe8c25bba48f5369f135bf843651c3a4"
}
```

## Encrypted channels

[Encrypted channels](/docs/channels/using_channels/encrypted-channels) require an additional `shared_secret` key in the auth response, which is populated with the per-channel shared key to use for decryption. The key is base64 encoded, it must be decoded before use.

This value is not part of the signature for the auth token, it is independent of the value in the `auth` key.

For example:

```json
{
  "auth": "...", // as above for private channels
  "shared_secret": "<channel secret derived from master secret>"
}
```

## Presence channels

[Presence channels](/docs/channels/using_channels/presence-channels) require extra user data to be passed back to the client along with the auth string. These data need to be part of the signature as a valid JSON string. For presence channels, the signature is a HMAC SHA256 hex digest of the following string:

```js
<socket_id>:<channel_name>:<JSON encoded user data>
```

Ruby example for presence channels:

```rb
require "json"
require "openssl"

json_user_data = JSON.generate({
  :user_id => 10,
  :user_info => {:name => "Mr. Channels"} })
# NB: written as double-escaped JSON!
# => "{\"user_id\":10,\"user_info\":{\"name\":\"Mr. Channels\"}}"

digest = OpenSSL::Digest::SHA256.new

secret = "7ad3773142a6692b25b8"
string_to_sign = "1234.1234:presence-foobar:#{json_user_data}"
puts signature = OpenSSL::HMAC.hexdigest(digest, secret, string_to_sign)
# => afaed3695da2ffd16931f457e338e6c9f2921fa133ce7dac49f529792be6304c
```

The auth response should be a JSON string with a an `auth` property with a value composed of the application key and the authentication signature separated by a colon ':'. A `channel_data` property should also be present composed of the data for the channel as a **string** (_note: double-encoded JSON_):

```json
{
  "auth": "278d425bdf160c739803:afaed3695da2ffd16931f457e338e6c9f2921fa133ce7dac49f529792be6304c",
  "channel_data": "{\"user_id\":10,\"user_info\":{\"name\":\"Mr. Channels\"}}"
}
```

> **Note:** The whole response must be JSON-encoded before returning it to the client, even if `channel_data` inside it is already JSON-encoded.
