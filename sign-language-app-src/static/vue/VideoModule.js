import { store } from './store.js'


export default {
    data() {
      return {
        store,
      }
    },
    template: `
    <video width="100%" id="signVid" controls>
        <source :src="('https://indirivacua.github.io/lsa64_cut/') + ('00' + String(store.sign)).slice(-3) + '_' + (('00') + String(Math.floor(Math.random() * 10) + 1)).slice(-3) + ('_001.mp4')" type="video/mp4">
        Your browser does not support the video tag.
    </video>`
}
