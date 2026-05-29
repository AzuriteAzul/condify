import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Flex,
  Spacer,
  Select,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Tooltip,
  IconButton,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  ModalCloseButton,
  ButtonGroup,
  InputGroup,
  InputRightElement,
  Image,
  Link,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import { FiDownload, FiCalendar, FiDollarSign, FiEye } from 'react-icons/fi'
import { DeleteIcon, DownloadIcon, AttachmentIcon, ViewIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { getFullyPaidFractions } from '../lib/data'
import { CONFIG, getYearRange, formatCurrency } from '../config'

const MotionBox = motion(Box)

interface PaymentStatus {
  id: string;
  fraction: string;
  status: 'paid' | 'pending';
  amount: number;
  lastPaymentDate?: string;
}

interface PaymentProof {
  id: string
  fraction: string
  month: number
  year: number
  fileName: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  fileData?: string // Make optional since we won't store it in localStorage
}

interface PaymentValue {
  id: string
  fraction: string
  amount: number
  last_updated: string
  updated_by: string
}

interface User {
  email: string
  fraction: string
  is_admin: boolean
}

interface QuoteMapProps {
  user: User
  isAdmin: boolean
  onUploadProof?: (fraction: string, month: number, year: number, file: File) => Promise<void>
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const

const acceptedFileTypes = '.pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.doc,.docx'

function QuoteMap({ user, isAdmin, onUploadProof }: QuoteMapProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isPasswordOpen, 
    onOpen: onPasswordOpen, 
    onClose: onPasswordClose 
  } = useDisclosure()
  const [selectedFraction, setSelectedFraction] = useState<string>('')
  const cancelRef = useRef<HTMLButtonElement>(null)
  
  // Set initial month and year to June 2025 if current date is before that
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const now = new Date()
    const condominiumStartDate = CONFIG.CONDOMINIUM_START_DATE
    
    if (now < condominiumStartDate) {
      return condominiumStartDate.getMonth()
    }
    return now.getMonth()
  })
  
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const now = new Date()
    const condominiumStartDate = CONFIG.CONDOMINIUM_START_DATE
    
    if (now < condominiumStartDate) {
      return condominiumStartDate.getFullYear()
    }
    return now.getFullYear()
  })
  
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([])
  const [paymentValues, setPaymentValues] = useState<PaymentValue[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const toast = useToast()
  const [forceUpdate, setForceUpdate] = useState(0)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [proofToDelete, setProofToDelete] = useState<string | null>(null)
  
  // Dark mode color variables
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300')
  const textColorMuted = useColorModeValue('gray.500', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600')
  
  // Create a memoized lookup map for payment proofs for faster access
  const proofLookup = useMemo(() => {
    const lookup = new Map<string, PaymentProof>()
    paymentProofs.forEach(proof => {
      const key = `${proof.fraction}-${proof.month}-${proof.year}`
      lookup.set(key, proof)
    })
    return lookup
  }, [paymentProofs])

  // Create a memoized lookup map for payment values
  const paymentValueLookup = useMemo(() => {
    const lookup = new Map<string, number>()
    paymentValues.forEach(pv => {
      lookup.set(pv.fraction, pv.amount)
    })
    return lookup
  }, [paymentValues])

  // Optimized payment status calculation using memoization
  const paymentStatuses = useMemo(() => {
    console.log('🧮 Starting payment status calculation...')
    const startTime = Date.now()
    
    // Check if fractions are fully paid up to the current month (not just selected month)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startMonth = 5 // June (0-based)
    const startYear = 2025
    
    console.log(`📅 Checking payments from ${startMonth}/${startYear} to ${currentMonth}/${currentYear}`)
    console.log(`📊 Processing ${paymentProofs.length} payment proofs`)
    
    // Use the shared utility to check if fractions are fully paid up to current month
    const fullyPaidFractions = getFullyPaidFractions(paymentProofs, startMonth, startYear, currentMonth, currentYear)
    
    console.log(`✅ Fully paid fractions: ${fullyPaidFractions.join(', ')}`)
    
    const result = ['A', 'B', 'C', 'D', 'E', 'F'].map(fraction => {
      const amount = paymentValueLookup.get(fraction) || 150
      const isPaid = fullyPaidFractions.includes(fraction)
      // Find the latest payment proof for this fraction
      const fractionProofs = paymentProofs.filter(proof => proof.fraction === fraction)
      const latestProof = fractionProofs.length > 0 
        ? fractionProofs.reduce((latest, current) => 
            new Date(current.uploadedAt || '') > new Date(latest.uploadedAt || '') ? current : latest
          )
        : null
      return {
        id: fraction,
        fraction,
        status: (isPaid ? 'paid' : 'pending') as 'paid' | 'pending',
        amount,
        lastPaymentDate: latestProof ? `${months[latestProof.month]} ${latestProof.year}` : undefined
      }
    })
    
    const totalTime = Date.now() - startTime
    console.log(`✅ Payment status calculation completed in ${totalTime}ms`)
    
    return result
  }, [paymentProofs, paymentValues, proofLookup, paymentValueLookup])

  // Load payment values from Supabase
  const loadPaymentValues = async () => {
    console.log('🔄 Starting to load payment values...')
    const startTime = Date.now()
    
    try {
      console.log('📡 Querying payment_values table...')
      const { data, error } = await supabase
        .from('payment_values')
        .select('*')
        .order('fraction', { ascending: true })

      const queryTime = Date.now() - startTime
      console.log(`⏱️ Payment values query completed in ${queryTime}ms`)

      if (error) {
        console.error('❌ Error loading payment values:', error)
        toast({
          title: 'Erro ao carregar valores',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } else {
        console.log(`📊 Found ${data?.length || 0} payment values`)
        const totalTime = Date.now() - startTime
        console.log(`✅ Payment values loaded successfully in ${totalTime}ms`)
        setPaymentValues(data || [])
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`❌ Error loading payment values after ${totalTime}ms:`, error)
    }
  }

  // Load payment proofs from Supabase
  const loadPaymentProofs = async () => {
    console.log('🔄 Starting to load payment proofs...')
    const startTime = Date.now()
    
    try {
      // Only select necessary fields, exclude file_url to prevent timeout
      console.log('📡 Querying payment_proofs table...')
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('id, fraction, month, year, file_name, file_type, file_size, uploaded_by, uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1000) // Add limit to prevent loading too many records

      const queryTime = Date.now() - startTime
      console.log(`⏱️ Query completed in ${queryTime}ms`)

      if (error) {
        console.error('❌ Error loading payment proofs:', error)
        toast({
          title: 'Erro ao carregar comprovativos',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } else {
        console.log(`📊 Found ${data?.length || 0} payment proofs`)
        
        // Convert database format to component format
        const proofs: PaymentProof[] = (data || []).map(proof => ({
          id: proof.id,
          fraction: proof.fraction,
          month: proof.month,
          year: proof.year,
          fileName: proof.file_name,
          fileType: proof.file_type,
          fileSize: proof.file_size,
          uploadedBy: proof.uploaded_by,
          uploadedAt: proof.uploaded_at,
          fileData: undefined // Don't load file data initially
        }))
        
        const totalTime = Date.now() - startTime
        console.log(`✅ Payment proofs loaded successfully in ${totalTime}ms`)
        setPaymentProofs(proofs)
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`❌ Error loading payment proofs after ${totalTime}ms:`, error)
      toast({
        title: 'Erro ao carregar comprovativos',
        description: 'Ocorreu um erro ao carregar os comprovativos. Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // Load data on mount only - no polling due to slow database queries
  useEffect(() => {
    loadPaymentValues()
    loadPaymentProofs()
  }, [])

  const addActivityLog = (type: 'proof_uploaded' | 'proof_deleted', description: string, itemId?: string) => {
    const storedLogs = localStorage.getItem('activityLogs')
    const logs = storedLogs ? JSON.parse(storedLogs) : []
    
    const newLog = {
      id: Date.now().toString(),
      type,
      description,
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      itemId
    }
    
    logs.unshift(newLog) // Add to beginning
    localStorage.setItem('activityLogs', JSON.stringify(logs))
  }

  const hoverBgColor = useColorModeValue('gray.50', 'gray.600')

  const filteredPayments = paymentStatuses.filter((payment) => {
    if (filter === 'all') return true
    return payment.status === filter
  })

  const getStatusColor = (status: PaymentStatus['status']): 'green' | 'red' => {
    return status === 'paid' ? 'green' : 'red'
  }

  const getStatusText = (status: PaymentStatus['status']) => {
    return status === 'paid' ? 'Paga' : 'Pendente'
  }

  const handleFractionClick = (fraction: string) => {
    setSelectedFraction(fraction)
    onOpen()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = acceptedFileTypes.split(',').map(ext => ext.replace('.', ''))
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Tipo de ficheiro não suportado',
        description: 'Por favor, selecione um ficheiro PDF, imagem ou documento.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Ficheiro demasiado grande',
        description: 'O ficheiro deve ter menos de 10MB.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsUploading(true)
    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const fileData = e.target?.result as string
        
        // Save to Supabase database
        const { data, error } = await supabase
          .from('payment_proofs')
          .insert([
            {
              fraction: selectedFraction,
              month: selectedMonth,
              year: selectedYear,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_url: fileData, // Store base64 data in file_url field for now
              uploaded_by: user.email,
            }
          ])
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        // Create proof object for local state
        const newProof: PaymentProof = {
          id: data.id,
          fraction: data.fraction,
          month: data.month,
          year: data.year,
          fileName: data.file_name,
          fileType: data.file_type,
          fileSize: data.file_size,
          uploadedBy: data.uploaded_by,
          uploadedAt: data.uploaded_at,
          fileData: fileData, // Keep in memory for current session
        }

        // Add to local state
        setPaymentProofs(prev => [newProof, ...prev])
        
        // Add income to budget when proof is uploaded
        await addIncomeFromProof(newProof)
        
        // Log the activity
        addActivityLog('proof_uploaded', `Comprovativo enviado - Fração ${selectedFraction} (${months[selectedMonth]} ${selectedYear})`, newProof.id)
        
        // Force update of payment statuses
        setForceUpdate(prev => prev + 1)
        
        toast({
          title: 'Comprovativo enviado',
          description: `Comprovativo para Fração ${selectedFraction} (${months[selectedMonth]} ${selectedYear}) enviado com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading proof:', error)
      toast({
        title: 'Erro ao enviar comprovativo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao enviar o comprovativo. Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const addIncomeFromProof = async (proof: PaymentProof) => {
    console.log('Adding income from proof:', proof)
    
    // Get payment values from database state
    const paymentValue = paymentValues.find((pv) => pv.fraction === proof.fraction)
    const amount = paymentValue ? paymentValue.amount : 150 // Default amount
    console.log('Payment value for fraction', proof.fraction, ':', amount)

    try {
      // Check if income already exists for this fraction and month
      const { data: existingItems, error: checkError } = await supabase
        .from('budget_items')
        .select('*')
        .eq('type', 'income')
        .eq('category', 'Quotas')
        .ilike('description', `%Fração ${proof.fraction}%`)
        .gte('start_date', new Date(Date.UTC(proof.year, proof.month, 1)).toISOString())
        .lt('start_date', new Date(Date.UTC(proof.year, proof.month + 1, 1)).toISOString())

      if (checkError) {
        console.error('Error checking existing income:', checkError)
        return
      }

      console.log('Existing items found:', existingItems)

      if (existingItems && existingItems.length > 0) {
        console.log('Income already exists, not creating duplicate')
        return
      }

      // Create new income item in database
      const newIncomeItem = {
        type: 'income',
        category: 'Quotas',
        description: `Pagamento de quotas - Fração ${proof.fraction} (${months[proof.month]} ${proof.year})`,
        amount: amount,
        is_recurring: false,
        start_date: new Date(Date.UTC(proof.year, proof.month, 1)).toISOString(),
        end_date: new Date(Date.UTC(proof.year, proof.month, 1)).toISOString(),
        created_by: proof.uploadedBy,
      }
      
      console.log('Creating new income item:', newIncomeItem)

      const { data: insertedItem, error: insertError } = await supabase
        .from('budget_items')
        .insert([newIncomeItem])
        .select()
        .single()

      if (insertError) {
        console.error('Error creating income item:', insertError)
        toast({
          title: 'Erro ao criar item de receita',
          description: insertError.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } else {
        console.log('Income item created successfully:', insertedItem)
        toast({
          title: 'Item de receita criado',
          description: `Receita de ${formatCurrency(amount)} adicionada ao orçamento`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error adding income from proof:', error)
      toast({
        title: 'Erro ao adicionar receita',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const removeIncomeFromProof = async (proof: PaymentProof) => {
    try {
      // Remove income item linked to this proof from database
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('type', 'income')
        .eq('category', 'Quotas')
        .ilike('description', `%Fração ${proof.fraction}%`)
        .gte('start_date', new Date(Date.UTC(proof.year, proof.month, 1)).toISOString())
        .lt('start_date', new Date(Date.UTC(proof.year, proof.month + 1, 1)).toISOString())

      if (error) {
        console.error('Error removing income from proof:', error)
      }
    } catch (error) {
      console.error('Error removing income from proof:', error)
    }
  }

  const handleDeleteProof = async (proofId: string) => {
    const proof = paymentProofs.find(p => p.id === proofId)
    if (!proof) return

    // If admin is deleting, require password confirmation
    if (isAdmin) {
      setProofToDelete(proofId)
      onPasswordOpen()
      return
    }

    // For non-admin users, proceed with deletion
    await performDeleteProof(proofId, proof)
  }

  const performDeleteProof = async (proofId: string, proof: PaymentProof) => {
    try {
      // Delete from Supabase database
      const { error } = await supabase
        .from('payment_proofs')
        .delete()
        .eq('id', proofId)

      if (error) {
        throw new Error(error.message)
      }

      // Remove from local state
      setPaymentProofs(prev => prev.filter(p => p.id !== proofId))
      
      // Remove corresponding income from budget
      await removeIncomeFromProof(proof)
      
      // Log the activity
      addActivityLog('proof_deleted', `Comprovativo eliminado - Fração ${proof.fraction} (${months[proof.month]} ${proof.year})`, proofId)
      
      toast({
        title: 'Comprovativo eliminado',
        description: 'O comprovativo foi eliminado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error deleting proof:', error)
      toast({
        title: 'Erro ao eliminar comprovativo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao eliminar o comprovativo.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handlePasswordConfirm = async () => {
    if (!proofToDelete) return

    try {
      // Verify password using Supabase Auth by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      })

      if (error) {
        // If signInWithPassword fails, it means the password is incorrect
        toast({
          title: 'Password incorreta',
          description: 'A password introduzida não está correta.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      // Password is correct, proceed with deletion
      const proof = paymentProofs.find(p => p.id === proofToDelete)
      if (proof) {
        await performDeleteProof(proofToDelete, proof)
      }

      // Reset modal state
      setPassword('')
      setProofToDelete(null)
      onPasswordClose()
      
    } catch (error) {
      console.error('Error verifying password:', error)
      toast({
        title: 'Erro na verificação',
        description: 'Ocorreu um erro ao verificar a password.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getProofsForPeriod = (fraction: string, month: number, year: number) => {
    return paymentProofs.filter(
      proof => proof.fraction === fraction && 
              proof.month === month && 
              proof.year === year
    )
  }

  const handleViewProof = async (proof: PaymentProof) => {
    try {
      let fileData = proof.fileData
      
      // If file data is not loaded, fetch it from database
      if (!fileData) {
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('file_url')
          .eq('id', proof.id)
          .single()
        
        if (error) {
          throw new Error(error.message)
        }
        
        fileData = data.file_url
      }
      
      if (!fileData) {
        toast({
          title: 'Ficheiro não disponível',
          description: 'O ficheiro não está disponível para visualização. Pode ter sido removido ou não foi carregado corretamente.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      
      // Create a blob URL for viewing
      const byteCharacters = atob(fileData.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: proof.fileType })
      const url = URL.createObjectURL(blob)
      
      // Open in new tab
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error viewing proof:', error)
      toast({
        title: 'Erro ao visualizar comprovativo',
        description: 'Ocorreu um erro ao carregar o ficheiro. Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleDownloadProof = async (proof: PaymentProof) => {
    try {
      let fileData = proof.fileData
      
      // If file data is not loaded, fetch it from database
      if (!fileData) {
        const { data, error } = await supabase
          .from('payment_proofs')
          .select('file_url')
          .eq('id', proof.id)
          .single()
        
        if (error) {
          throw new Error(error.message)
        }
        
        fileData = data.file_url
      }
      
      if (!fileData) {
        toast({
          title: 'Ficheiro não disponível',
          description: 'O ficheiro não está disponível para transferência. Pode ter sido removido ou não foi carregado corretamente.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      
      // Create a blob URL for downloading
      const byteCharacters = atob(fileData.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: proof.fileType })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = proof.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading proof:', error)
      toast({
        title: 'Erro ao transferir comprovativo',
        description: 'Ocorreu um erro ao carregar o ficheiro. Por favor, tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const canUploadForFraction = (fraction: string) => {
    return isAdmin || user.fraction === fraction
  }

  const canDeleteProof = (proof: PaymentProof) => {
    return isAdmin || proof.uploadedBy === user.email
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canViewProof = (fraction: string) => {
    return isAdmin || user.fraction === fraction
  }

  return (
    <Container maxW="container.xl" py={8} pb={32}>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        mb={8}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="2xl" color={textColor} mb={2}>
              🗺️ Mapa de Quotas
            </Heading>
            <Text fontSize="lg" color={textColorSecondary}>
              Acompanhe o estado dos pagamentos, por fração
            </Text>
          </Box>
        </Flex>

        {/* Filter Controls */}
        <Card
          bg={cardBg}
          borderWidth="1px"
          borderColor={cardBorderColor}
          _hover={{ boxShadow: 'md' }}
          transition="all 0.2s"
          mb={6}
        >
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl maxW={{ base: 'full', md: '200px' }}>
                <FormLabel fontSize="sm" fontWeight="medium" color={textColorSecondary}>Filtrar por:</FormLabel>
                <Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'paid' | 'pending')}
                  borderColor="gray.300"
                  _hover={{ borderColor: 'blue.400' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                >
                  <option value="all">Todos</option>
                  <option value="paid">Pagas</option>
                  <option value="pending">Pendentes</option>
                </Select>
              </FormControl>

              <ButtonGroup size="sm" flexWrap="wrap" gap={2}>
                <Button
                  colorScheme={filter === 'all' ? 'blue' : 'gray'}
                  variant={filter === 'all' ? 'solid' : 'outline'}
                  onClick={() => setFilter('all')}
                  _hover={{ transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                >
                  📊 Todas
                </Button>
                <Button
                  colorScheme={filter === 'paid' ? 'green' : 'gray'}
                  variant={filter === 'paid' ? 'solid' : 'outline'}
                  onClick={() => setFilter('paid')}
                  _hover={{ transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                >
                  ✅ Pagas
                </Button>
                <Button
                  colorScheme={filter === 'pending' ? 'red' : 'gray'}
                  variant={filter === 'pending' ? 'solid' : 'outline'}
                  onClick={() => setFilter('pending')}
                  _hover={{ transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                >
                  ⏳ Pendentes
                </Button>
              </ButtonGroup>
            </VStack>
          </CardBody>
        </Card>
      </MotionBox>

      {/* Fractions Grid */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Grid 
          templateColumns={{ 
            base: 'repeat(1, 1fr)', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }} 
          gap={6}
        >
          {filteredPayments.map((payment, index) => (
            <MotionBox
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorderColor}
                cursor="pointer"
                _hover={{ 
                  borderColor: payment.status === 'paid' ? 'green.300' : 'red.300', 
                  boxShadow: 'lg',
                  transform: 'translateY(-2px)'
                }}
                onClick={() => handleFractionClick(payment.fraction)}
                transition="all 0.2s"
                minH="140px"
              >
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xl" fontWeight="bold" color={textColor}>
                        🏠 Fração {payment.fraction}
                      </Text>
                      <Badge
                        colorScheme={getStatusColor(payment.status)}
                        variant="subtle"
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {payment.status === 'paid' ? '✅ PAGA' : '⏳ PENDENTE'}
                      </Badge>
                    </HStack>
                    
                    <HStack spacing={2} color={textColorSecondary}>
                      <Icon as={FiDollarSign} />
                      <Text fontWeight="bold" fontSize="lg" color={payment.status === 'paid' ? 'green.500' : 'red.500'}>
                        {formatCurrency(payment.amount)}
                      </Text>
                    </HStack>
                    
                    {payment.lastPaymentDate && (
                      <HStack spacing={2} color={textColorMuted} fontSize="sm">
                        <Icon as={FiCalendar} />
                        <Text>
                          Último: {payment.lastPaymentDate}
                        </Text>
                      </HStack>
                    )}
                    
                    <HStack spacing={2} color="blue.500" fontSize="sm" mt={2}>
                      <Icon as={FiEye} />
                      <Text fontWeight="medium">
                        Clique para ver comprovativos
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>
          ))}
        </Grid>

        {filteredPayments.length === 0 && (
          <Center py={12}>
            <VStack spacing={3}>
              <Box fontSize="4xl">🗺️</Box>
              <Text color={textColorMuted} fontSize="lg">
                Nenhum resultado encontrado
              </Text>
              <Text color={textColorMuted} fontSize="sm">
                Tente ajustar os filtros de pesquisa
              </Text>
            </VStack>
          </Center>
        )}
      </MotionBox>

      <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'xl' }}>
        <ModalOverlay />
        <ModalContent mx={{ base: 2, md: 'auto' }}>
          <ModalHeader>Comprovativos de Pagamento - Fração {selectedFraction}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <VStack spacing={2} align="stretch">
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </Select>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {getYearRange().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </VStack>

              <Divider />

              <Text fontWeight="bold">
                Comprovativos para {months[selectedMonth]} {selectedYear}:
              </Text>

              {(() => {
                const proofs = getProofsForPeriod(selectedFraction, selectedMonth, selectedYear)
                return proofs.length > 0 ? (
                  <VStack spacing={3} align="stretch">
                    {proofs.map((proof) => (
                      <Box
                        key={proof.id}
                        p={3}
                        borderWidth={1}
                        borderRadius="md"
                        borderColor={borderColor}
                      >
                        <VStack align="start" spacing={2}>
                          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>
                            {proof.fileName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatFileSize(proof.fileSize)} • Enviado por {proof.uploadedBy}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(proof.uploadedAt).toLocaleDateString('pt-PT')}
                          </Text>
                          <HStack spacing={2} flexWrap="wrap">
                            <Tooltip label="Ver ficheiro">
                              <IconButton
                                aria-label="View file"
                                icon={<ViewIcon />}
                                size="sm"
                                colorScheme="blue"
                                variant="ghost"
                                onClick={() => handleViewProof(proof)}
                              />
                            </Tooltip>
                            <Tooltip label="Transferir">
                              <IconButton
                                aria-label="Download file"
                                icon={<DownloadIcon />}
                                size="sm"
                                colorScheme="green"
                                variant="ghost"
                                onClick={() => handleDownloadProof(proof)}
                              />
                            </Tooltip>
                            {canDeleteProof(proof) && (
                              <Tooltip label="Eliminar">
                                <IconButton
                                  aria-label="Delete file"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteProof(proof.id)}
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">Nenhum comprovativo disponível para este período.</Text>
                )
              })()}

              {canUploadForFraction(selectedFraction) && (
                <>
                  <Divider />
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      {isAdmin ? 'Upload de comprovativo (Admin):' : 'Upload do seu comprovativo:'}
                    </Text>
                    <input
                      type="file"
                      accept={acceptedFileTypes}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      id="proof-upload"
                    />
                    <Button
                      as="label"
                      htmlFor="proof-upload"
                      leftIcon={<AttachmentIcon />}
                      colorScheme="blue"
                      isLoading={isUploading}
                      loadingText="A enviar..."
                      size={{ base: 'sm', md: 'md' }}
                    >
                      Upload Comprovativo
                    </Button>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Formatos aceites: PDF, JPG, JPEG, PNG, GIF, BMP, TIFF, DOC, DOCX (máx. 10MB)
                    </Text>
                  </Box>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={!!proofToDelete} onClose={() => setProofToDelete(null)} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Comprovativo
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem a certeza que pretende eliminar este comprovativo? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setProofToDelete(null)}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={() => {
                if (proofToDelete) {
                  performDeleteProof(proofToDelete, paymentProofs.find(p => p.id === proofToDelete)!)
                  setProofToDelete(null)
                }
              }} ml={3}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
}

export default QuoteMap 