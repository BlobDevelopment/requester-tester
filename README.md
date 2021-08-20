# Requester Tester

This tool allows you to add HTTP response testing to your pipeline. Unit tests are nice but can be annoying to write and may not cover everything.
This is a quick and simple way to send requests and test the responses.

## Install!
To install this tool all you need to do is simply run `npm i -g @BlobDevelopment/requester-tester`

Once that is done you can run `requester-tester` anywhere!

## Example
The tool is super easy to use! You simply need to call the tool with a YAML file or directory. These files will tell the tool how to do the requests.

The command accepts 2 arguments, the URL to test and the file or directory to test.

### Simple Example
Command:
`requester-test https://api.local simple.yml`

simple.yml:
```yaml
requests:
  hello-world:
    method: GET
    path: /
    expect:
      status: 200
      body: '{"Hello": "World!"}'
```

Here is how it looks in action: // TODO: Add video/gif

### More Complex Example
Command:
`requester-tester https://api.local test/`

You can make as many files you want in order to organise your tests. A good example of this is:
```
test
  auth
    signin.yml
    signup.yml
    signout.yml
  post
    new.yml
    edit.yml
    delete.yml
```

Here is how it looks in action: // TODO: Add video/gif

## Configuration
```yaml
# All requests go under this top level node
requests:
  # This is the node for a request. This name should be descriptive. For example: "login-succeeds" or "login-failure-on-missing-email"
  example:
    # [Optional] The method of this request. If it's omitted, this defaults to GET 
    method: GET
    # The path to request.
    path: /
    # [Optional] The request body to send
    body: '{"username": "Walshy", "pin": 1111}'
    # [Optional] List of headers of which to send in our request. Format: '<name>: <value>' - it requires a value!
    headers:
      - 'Client: 1f09d30c707d53f3d16c530dd73d70a6ce7596a9'
    # [Optional] List of headers of which to send in our request. Format: '<name>: <value>' - it requires a value!
    cookies:
      - 'session_id: 145'
    # The node which holds all the expected criteria
    expect:
      # [Optional] The status code that we expect the response to be
      status: 200
      # [Optional] The body that we expect the response to be
      body: '{"Hello", "World!"}'
      # [Optional] List of headers that we expect the response to have.
      # You can do this in 2 ways:
      #   * 'Server: MyCustomServer' - This specifies it wants the "Server" header with the value "MyCustomServer"
      #   * 'Authorization'          - This specifies it wants the "Authorization" header but doesn't care what the value is 
      headers:
        - 'Server: MyCustomServer'
        - 'Authorization'
      # [Optional] List of cookies that we expect the response to set.
      # You can do this in 2 ways:
      #   * 'session_id: 145' - This specifies it wants the "session_id" cookie with the value "145"
      #   * 'auth'            - This specifies it wants the "auth" cookie but doesn't care what the value is
      cookies: 
        - 'session_id: 145'
        - 'auth'
```