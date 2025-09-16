import axios from 'axios'
const API=axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
})
API.interceptors.request.use((config)=>{
    if(typeof window !== 'undefined'){
        const token=localStorage.getItem('token')

    if(token && config.headers)
        config.headers.Authorization=`Bearer ${token}`
}
return config;

})
export default API