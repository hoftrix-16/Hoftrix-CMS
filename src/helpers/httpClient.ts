import api from './api'

function HttpClient() {
  return {
    get: api.get.bind(api),
    post: api.post.bind(api),
    patch: api.patch.bind(api),
    put: api.put.bind(api),
    delete: api.delete.bind(api),
  }
}

export default HttpClient()
