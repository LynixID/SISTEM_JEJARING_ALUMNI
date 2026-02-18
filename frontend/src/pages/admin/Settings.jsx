import { useState, useEffect } from 'react'
import { Mail, Bot, Settings as SettingsIcon, Save, Plus, X, Trash2 } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import api from '../../services/api'

const Settings = () => {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [error, setError] = useState('')

  const categories = [
    { id: 'EMAIL', label: 'Email', icon: Mail, color: 'blue' },
    { id: 'AI', label: 'AI Settings', icon: Bot, color: 'purple' },
    { id: 'GENERAL', label: 'Umum', icon: SettingsIcon, color: 'gray' }
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/settings')
      setSettings(response.data.settings)
      setError('')
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (key, newValue) => {
    try {
      setSaving(prev => ({ ...prev, [key]: true }))
      await api.put(`/settings/${key}`, { value: newValue })
      
      // Update local state
      setSettings(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(category => {
          const setting = updated[category].find(s => s.key === key)
          if (setting) {
            setting.value = newValue
          }
        })
        return updated
      })
      
      setError('')
    } catch (error) {
      console.error('Error updating setting:', error)
      setError(error.response?.data?.error || 'Gagal memperbarui pengaturan')
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleEmailSave = async (key, emails) => {
    // Filter empty emails and validate
    const validEmails = emails
      .map(e => e.trim())
      .filter(e => e !== '')
      .filter(e => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(e)
      })
    
    // Only save if there are valid emails
    if (validEmails.length > 0 || emails.every(e => e.trim() === '')) {
      await handleUpdate(key, validEmails.length > 0 ? validEmails : [])
    }
  }

  const renderEmailSettings = (emailSettings) => {
    if (!emailSettings || emailSettings.length === 0) return null

    return emailSettings.map((setting) => {
      if (setting.key === 'admin_notification_emails') {
        const emails = Array.isArray(setting.value) ? setting.value : []
        
        return (
          <div key={setting.key} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {setting.label}
            </label>
            {setting.description && (
              <p className="text-xs text-gray-500 mb-3">{setting.description}</p>
            )}
            
            <div className="space-y-2">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const updated = [...emails]
                      updated[index] = e.target.value
                      // Update local state immediately for better UX
                      setSettings(prev => {
                        const newSettings = { ...prev }
                        Object.keys(newSettings).forEach(cat => {
                          const s = newSettings[cat].find(ss => ss.key === setting.key)
                          if (s) {
                            s.value = updated
                          }
                        })
                        return newSettings
                      })
                    }}
                    onBlur={() => {
                      // Save when user leaves the field
                      const updated = [...emails]
                      handleEmailSave(setting.key, updated)
                    }}
                    placeholder="admin@example.com"
                    className="flex-1"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const updated = emails.filter((_, i) => i !== index)
                      handleEmailSave(setting.key, updated)
                    }}
                    disabled={emails.length === 1}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const updated = [...emails, '']
                  setSettings(prev => {
                    const newSettings = { ...prev }
                    Object.keys(newSettings).forEach(cat => {
                      const s = newSettings[cat].find(ss => ss.key === setting.key)
                      if (s) {
                        s.value = updated
                      }
                    })
                    return newSettings
                  })
                }}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Tambah Email
              </Button>
            </div>
            
            {saving[setting.key] && (
              <p className="text-xs text-blue-600 mt-2">Menyimpan...</p>
            )}
          </div>
        )
      }
      return null
    })
  }

  const renderAISettings = (aiSettings) => {
    if (!aiSettings || aiSettings.length === 0) return null

    return aiSettings.map((setting) => (
      <div key={setting.key} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {setting.label}
        </label>
        {setting.description && (
          <p className="text-xs text-gray-500 mb-3">{setting.description}</p>
        )}
        
        <Input
          type={setting.type === 'NUMBER' ? 'number' : 'text'}
          value={setting.value || ''}
          onChange={(e) => {
            const newValue = setting.type === 'NUMBER' 
              ? Number(e.target.value) 
              : e.target.value
            handleUpdate(setting.key, newValue)
          }}
          placeholder={setting.description}
          className="w-full"
        />
        
        {saving[setting.key] && (
          <p className="text-xs text-blue-600 mt-2">Menyimpan...</p>
        )}
      </div>
    ))
  }

  const renderGeneralSettings = (generalSettings) => {
    if (!generalSettings || generalSettings.length === 0) return null

    return generalSettings.map((setting) => {
      if (setting.type === 'BOOLEAN') {
        return (
          <div key={setting.key} className="mb-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={setting.value === true || setting.value === 'true'}
                onChange={(e) => {
                  handleUpdate(setting.key, e.target.checked)
                }}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {setting.label}
                </span>
                {setting.description && (
                  <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                )}
              </div>
            </label>
            
            {saving[setting.key] && (
              <p className="text-xs text-blue-600 mt-2">Menyimpan...</p>
            )}
          </div>
        )
      }

      return (
        <div key={setting.key} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {setting.label}
          </label>
          {setting.description && (
            <p className="text-xs text-gray-500 mb-3">{setting.description}</p>
          )}
          
          <Input
            type={setting.type === 'NUMBER' ? 'number' : 'text'}
            value={setting.value || ''}
            onChange={(e) => {
              const newValue = setting.type === 'NUMBER' 
                ? Number(e.target.value) 
                : e.target.value
              handleUpdate(setting.key, newValue)
            }}
            placeholder={setting.description}
            className="w-full"
          />
          
          {saving[setting.key] && (
            <p className="text-xs text-blue-600 mt-2">Menyimpan...</p>
          )}
        </div>
      )
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Memuat pengaturan...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-0">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan</h1>
            <p className="text-gray-600">Kelola pengaturan sistem</p>
          </div>

              {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {categories.map((category) => {
              const categorySettings = settings[category.id] || []
              if (categorySettings.length === 0) return null

              return (
                <Card key={category.id} className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <category.icon 
                      size={24} 
                      className={`text-${category.color}-600`}
                    />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {category.label}
                    </h2>
                  </div>

                  {category.id === 'EMAIL' && renderEmailSettings(categorySettings)}
                  {category.id === 'AI' && renderAISettings(categorySettings)}
                  {category.id === 'GENERAL' && renderGeneralSettings(categorySettings)}
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

