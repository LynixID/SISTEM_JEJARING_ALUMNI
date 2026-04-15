import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSocket } from '../../config/socket'
import { useNavigate } from 'react-router-dom'

const GlobalSuspendListener = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!user) return
        
        const socket = getSocket()
        
        const handleSuspend = (data) => {
            const reason = data?.reason || 'Pelanggaran ketentuan layanan'
            if (logout) {
                logout()
            }
            navigate('/login', { state: { suspendInfo: { reason, date: new Date().toISOString() } } })
        }

        socket.on('ACCOUNT_SUSPENDED', handleSuspend)

        return () => {
            socket.off('ACCOUNT_SUSPENDED', handleSuspend)
        }
    }, [user, logout, navigate])

    return null
}

export default GlobalSuspendListener
