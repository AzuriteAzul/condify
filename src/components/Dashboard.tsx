import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Badge,
  Icon,
  Flex,
  Spinner,
  SimpleGrid,
  Divider,
  Avatar,
} from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon, DeleteIcon, AddIcon, EditIcon, TimeIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getFullyPaidFractions } from '../lib/data'
import { CONFIG, getYearRange, formatCurrency } from '../config'
import type { PaymentProof as LibPaymentProof } from '../lib/data'
import { useAuth } from '../contexts/AuthContext'
import {
  FaDoorOpen,
  FaUsers,
  FaBullhorn,
  FaTasks,
  FaPiggyBank,
  FaCog,
  FaUserCircle,
} from 'react-icons/fa'

interface User {
  email: string
  fraction: string
  is_admin: boolean
  name?: string | null
}

interface BudgetItem {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  isRecurring: boolean
  startDate: string
  endDate?: string
  frequency?: 'monthly' | 'quarterly' | 'yearly'
  createdAt: string
  createdBy: string
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
  fileData?: string
}

interface ActivityLog {
  id: string
  type: 'budget_created' | 'budget_deleted' | 'proof_uploaded' | 'proof_deleted' | 'budget_updated'
  description: string
  createdAt: string
  createdBy: string
  itemId?: string
}

interface DashboardProps {
  user: User
}

const months = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
] as const

const MotionBox = motion(Box)

export default function Dashboard() {
  const { user } = useAuth()
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300')
  const textColorMuted = useColorModeValue('gray.500', 'gray.400')
  const cardBgWhite = useColorModeValue('white', 'gray.800')
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600')
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')

  // Generate year options for the dropdown
  const yearOptions = getYearRange()

  // Load budget items from Supabase
  const loadBudgetItems = async () => {
    console.log('🔄 Dashboard: Starting to load budget items...')
    const startTime = Date.now()
    
    try {
      console.log('📡 Dashboard: Querying budget_items table...')
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .order('created_at', { ascending: false })

      const queryTime = Date.now() - startTime
      console.log(`⏱️ Dashboard: Budget items query completed in ${queryTime}ms`)

      if (error) {
        console.error('❌ Dashboard: Error loading budget items:', error)
      } else {
        console.log(`📊 Dashboard: Found ${data?.length || 0} budget items`)
        
        // Convert database format to component format
        const items: BudgetItem[] = (data || []).map(item => ({
          id: item.id,
          type: item.type,
          category: item.category,
          description: item.description,
          amount: item.amount,
          isRecurring: item.is_recurring,
          startDate: item.start_date,
          endDate: item.end_date,
          frequency: item.frequency,
          createdAt: item.created_at,
          createdBy: item.created_by,
        }))
        
        const totalTime = Date.now() - startTime
        console.log(`✅ Dashboard: Budget items loaded successfully in ${totalTime}ms`)
        setBudgetItems(items)
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`❌ Dashboard: Error loading budget items after ${totalTime}ms:`, error)
    }
  }

  // Load payment proofs from Supabase
  const loadPaymentProofs = async () => {
    console.log('🔄 Dashboard: Starting to load payment proofs...')
    const startTime = Date.now()
    
    try {
      console.log('📡 Dashboard: Querying payment_proofs table...')
      // Only select necessary fields, exclude file_url to prevent timeout
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('id, fraction, month, year, file_name, file_type, file_size, uploaded_by, uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1000) // Add limit to prevent loading too many records

      const queryTime = Date.now() - startTime
      console.log(`⏱️ Dashboard: Payment proofs query completed in ${queryTime}ms`)

      if (error) {
        console.error('❌ Dashboard: Error loading payment proofs:', error)
      } else {
        console.log(`📊 Dashboard: Found ${data?.length || 0} payment proofs`)
        
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
        console.log(`✅ Dashboard: Payment proofs loaded successfully in ${totalTime}ms`)
        setPaymentProofs(proofs)
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`❌ Dashboard: Error loading payment proofs after ${totalTime}ms:`, error)
    }
  }

  // Load users from Supabase
  const loadUsers = async () => {
    console.log('🔄 Dashboard: Starting to load users...')
    const startTime = Date.now()
    
    try {
      console.log('📡 Dashboard: Querying users table...')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('email', { ascending: true })

      const queryTime = Date.now() - startTime
      console.log(`⏱️ Dashboard: Users query completed in ${queryTime}ms`)

      if (error) {
        console.error('❌ Dashboard: Error loading users:', error)
      } else {
        console.log(`📊 Dashboard: Found ${data?.length || 0} users`)
        
        const userList: User[] = (data || []).map(user => ({
          email: user.email,
          fraction: user.fraction,
          is_admin: user.is_admin,
          name: user.name,
        }))
        
        const totalTime = Date.now() - startTime
        console.log(`✅ Dashboard: Users loaded successfully in ${totalTime}ms`)
        setUsers(userList)
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`❌ Dashboard: Error loading users after ${totalTime}ms:`, error)
    }
  }

  // Load activity logs from localStorage (these are still stored locally)
  const loadActivityLogs = () => {
    const storedActivityLogs = localStorage.getItem('activityLogs')
    if (storedActivityLogs) {
      try {
        const newActivityLogs = JSON.parse(storedActivityLogs)
        setActivityLogs(newActivityLogs)
      } catch (error) {
        console.error('Error parsing activity logs from localStorage:', error)
      }
    }
  }

  // Load all data on mount
  useEffect(() => {
    loadBudgetItems()
    loadPaymentProofs()
    loadUsers()
    loadActivityLogs()
  }, [])

  // Calculate current month's financial data
  const getCurrentMonthData = () => {
    const condominiumStartDate = CONFIG.CONDOMINIUM_START_DATE
    
    const currentItems = budgetItems.filter(item => {
      const startDate = new Date(item.startDate)
      
      // Skip items before condominium start date
      if (startDate < condominiumStartDate) {
        return false
      }
      
      const startMonth = startDate.getMonth()
      const startYear = startDate.getFullYear()
      
      if (item.isRecurring) {
        if (item.frequency === 'monthly') {
          return startYear < currentYear || (startYear === currentYear && startMonth <= currentMonth)
        } else if (item.frequency === 'quarterly') {
          const quarter = Math.floor(currentMonth / 3)
          const startQuarter = Math.floor(startMonth / 3)
          return startYear < currentYear || (startYear === currentYear && startQuarter <= quarter)
        } else if (item.frequency === 'yearly') {
          return startYear <= currentYear
        }
      } else {
        const endDate = item.endDate ? new Date(item.endDate) : startDate
        const endMonth = endDate.getMonth()
        const endYear = endDate.getFullYear()
        
        return (startYear === currentYear && startMonth === currentMonth) ||
               (endYear === currentYear && endMonth === currentMonth) ||
               (startYear < currentYear && endYear > currentYear) ||
               (startYear === currentYear && endYear === currentYear && startMonth <= currentMonth && endMonth >= currentMonth)
      }
      return false
    })

    const income = currentItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
    const expenses = currentItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
    const balance = income - expenses

    return { income, expenses, balance, items: currentItems }
  }

  // Calculate all months of current year data for charts
  const getCurrentYearData = () => {
    const condominiumStartDate = CONFIG.CONDOMINIUM_START_DATE
    const data = []
    
    // Show all 12 months of the current year
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1)
      
      // Skip months before condominium start
      if (date < condominiumStartDate) {
        data.push({
          month: months[month],
          income: 0,
          expenses: 0,
          balance: 0
        })
        continue
      }
      
      const monthItems = budgetItems.filter(item => {
        const startDate = new Date(item.startDate)
        
        // Skip items before condominium start date
        if (startDate < condominiumStartDate) {
          return false
        }
        
        const startMonth = startDate.getMonth()
        const startYear = startDate.getFullYear()
        
        if (item.isRecurring) {
          // Check if item has ended before this month
          if (item.endDate) {
            const endDate = new Date(item.endDate)
            const endMonth = endDate.getMonth()
            const endYear = endDate.getFullYear()
            
            // If the end date is before the current month being processed, exclude it
            if (endYear < currentYear || (endYear === currentYear && endMonth < month)) {
              return false
            }
          }
          
          if (item.frequency === 'monthly') {
            return startYear < currentYear || (startYear === currentYear && startMonth <= month)
          } else if (item.frequency === 'quarterly') {
            const quarter = Math.floor(month / 3)
            const startQuarter = Math.floor(startMonth / 3)
            return startYear < currentYear || (startYear === currentYear && startQuarter <= quarter)
          } else if (item.frequency === 'yearly') {
            return startYear <= currentYear
          }
        } else {
          const endDate = item.endDate ? new Date(item.endDate) : startDate
          const endMonth = endDate.getMonth()
          const endYear = endDate.getFullYear()
          
          return (startYear === currentYear && startMonth === month) ||
                 (endYear === currentYear && endMonth === month) ||
                 (startYear < currentYear && endYear > currentYear) ||
                 (startYear === currentYear && endYear === currentYear && startMonth <= month && endMonth >= month)
        }
        return false
      })

      const income = monthItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
      const expenses = monthItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
      const balance = income - expenses

      data.push({
        month: months[month],
        income,
        expenses,
        balance
      })
    }
    return data
  }

  // Cache payment status calculation to avoid recalculating on every render
  const paymentStatus = useMemo(() => {
    console.log('🧮 Dashboard: Starting payment status calculation...')
    const startTime = Date.now()
    
    // Use current month/year
    const now = new Date()
    const startMonth = CONFIG.CONDOMINIUM_START_DATE.getMonth()
    const startYear = CONFIG.CONDOMINIUM_START_DATE.getFullYear()
    const endMonth = now.getMonth()
    const endYear = now.getFullYear()
    
    console.log(`📅 Dashboard: Checking payments from ${startMonth}/${startYear} to ${endMonth}/${endYear}`)
    console.log(`📊 Dashboard: Processing ${paymentProofs.length} payment proofs`)
    
    // Use the shared utility
    const fullyPaidFractions = getFullyPaidFractions(paymentProofs as LibPaymentProof[], startMonth, startYear, endMonth, endYear)
    const totalFractions = CONFIG.FRACTIONS.length
    const paidFractions = fullyPaidFractions.length
    const unpaidFractions = totalFractions - paidFractions
    const paymentRate = (paidFractions / totalFractions) * 100

    console.log(`✅ Dashboard: Fully paid fractions: ${fullyPaidFractions.join(', ')}`)
    console.log(`📊 Dashboard: Payment rate: ${paymentRate.toFixed(1)}%`)
    
    const totalTime = Date.now() - startTime
    console.log(`✅ Dashboard: Payment status calculation completed in ${totalTime}ms`)
    
    return { paidFractions, unpaidFractions, paymentRate, fullyPaidFractions }
  }, [paymentProofs]) // Only recalculate when paymentProofs change

  const currentMonthData = getCurrentMonthData()
  const currentYearData = getCurrentYearData()

  // Calculate total available balance (accumulated)
  const getTotalBalance = () => {
    let totalBalance = 0
    const startDate = CONFIG.CONDOMINIUM_START_DATE
    
    for (let year = startDate.getFullYear(); year <= currentYear; year++) {
      for (let month = year === startDate.getFullYear() ? startDate.getMonth() : 0; 
           month <= (year === currentYear ? currentMonth : 11); month++) {
        
        const monthItems = budgetItems.filter(item => {
          const itemStartDate = new Date(item.startDate)
          
          // Skip items before condominium start date
          if (itemStartDate < startDate) {
            return false
          }
          
          const itemStartMonth = itemStartDate.getMonth()
          const itemStartYear = itemStartDate.getFullYear()
          
          if (item.isRecurring) {
            // Check if item has ended before this month
            if (item.endDate) {
              const endDate = new Date(item.endDate)
              const endMonth = endDate.getMonth()
              const endYear = endDate.getFullYear()
              
              // If the end date is before the current month being processed, exclude it
              if (endYear < year || (endYear === year && endMonth < month)) {
                return false
              }
            }
            
            if (item.frequency === 'monthly') {
              return itemStartYear < year || (itemStartYear === year && itemStartMonth <= month)
            } else if (item.frequency === 'quarterly') {
              const quarter = Math.floor(month / 3)
              const startQuarter = Math.floor(itemStartMonth / 3)
              return itemStartYear < year || (itemStartYear === year && startQuarter <= quarter)
            } else if (item.frequency === 'yearly') {
              return itemStartYear <= year
            }
          } else {
            const endDate = item.endDate ? new Date(item.endDate) : itemStartDate
            const endMonth = endDate.getMonth()
            const endYear = endDate.getFullYear()
            
            return (itemStartYear === year && itemStartMonth === month) ||
                   (endYear === year && endMonth === month) ||
                   (itemStartYear < year && endYear > year) ||
                   (itemStartYear === year && endYear === year && itemStartMonth <= month && endMonth >= month)
          }
          return false
        })

        const income = monthItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
        const expenses = monthItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
        totalBalance += income - expenses
      }
    }
    return totalBalance
  }

  const totalBalance = getTotalBalance()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <Container maxW="container.xl" py={8} pb={32}>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        mb={8}
      >
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center" mb={6}>
            <Box>
              <HStack>
                <Text fontSize="4xl" fontWeight="bold" color={textColor}>
                  Bem-vind@, {user?.name?.split(' ')[0] || 'Utilizador'}
                </Text>
                <Text fontSize="4xl">👋</Text>
              </HStack>
              <Text fontSize="lg" color={textColorSecondary}>
                Aqui está um resumo do seu condomínio
              </Text>
            </Box>
            <Avatar
              size="lg"
              name={user?.name || user?.email}
              src={user?.user_metadata?.avatar_url}
              bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
              color="white"
              fontWeight="bold"
              boxShadow="0 2px 8px rgba(49, 130, 206, 0.3)"
            />
          </Flex>

          {/* Key Metrics */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
            <MotionBox variants={itemVariants} whileHover={{ scale: 1.02 }}>
              <Card
                bg={cardBgWhite}
                borderWidth="1px"
                borderColor={cardBorderColor}
                _hover={{ borderColor: 'green.300', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
              <CardBody>
                <Stat>
                    <StatLabel color={textColorSecondary} fontSize="sm" fontWeight="medium">Saldo Total</StatLabel>
                    <StatNumber color={totalBalance >= 0 ? 'green.500' : 'red.500'} fontSize="2xl" fontWeight="bold">
                      {formatCurrency(totalBalance)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type={totalBalance >= 0 ? 'increase' : 'decrease'} />
                    Saldo acumulado
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            </MotionBox>

            <MotionBox variants={itemVariants} whileHover={{ scale: 1.02 }}>
              <Card
                bg={cardBgWhite}
                borderWidth="1px"
                borderColor={cardBorderColor}
                _hover={{ borderColor: 'green.300', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
              <CardBody>
                <Stat>
                    <StatLabel color={textColorSecondary} fontSize="sm" fontWeight="medium">Receitas do Mês</StatLabel>
                    <StatNumber color="green.500" fontSize="2xl" fontWeight="bold">
                      {formatCurrency(currentMonthData.income)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Este mês
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            </MotionBox>

            <MotionBox variants={itemVariants} whileHover={{ scale: 1.02 }}>
              <Card
                bg={cardBgWhite}
                borderWidth="1px"
                borderColor={cardBorderColor}
                _hover={{ borderColor: 'red.300', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
              <CardBody>
                <Stat>
                    <StatLabel color={textColorSecondary} fontSize="sm" fontWeight="medium">Despesas do Mês</StatLabel>
                    <StatNumber color="red.500" fontSize="2xl" fontWeight="bold">
                      {formatCurrency(currentMonthData.expenses)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    Este mês
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            </MotionBox>

            <MotionBox variants={itemVariants} whileHover={{ scale: 1.02 }}>
              <Card
                bg={cardBgWhite}
                borderWidth="1px"
                borderColor={cardBorderColor}
                _hover={{ borderColor: 'blue.300', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
              <CardBody>
                <Stat>
                    <StatLabel color={textColorSecondary} fontSize="sm" fontWeight="medium">Pagamentos</StatLabel>
                    <StatNumber color="blue.500" fontSize="2xl" fontWeight="bold">
                    {paymentStatus.paidFractions}/6
                  </StatNumber>
                  <StatHelpText>
                    Frações pagas
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            </MotionBox>
          </SimpleGrid>
        </VStack>
      </MotionBox>

        {/* Charts and Detailed Info */}
      <MotionBox
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8} mb={8}>
          {/* Financial Chart */}
          <MotionBox variants={itemVariants}>
            <Card
              bg={cardBgWhite}
              borderWidth="1px"
              borderColor={cardBorderColor}
              _hover={{ boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              <CardHeader pb={4}>
                <Heading size="md" color={textColor}>
                  📊 Evolução Financeira ({currentYear})
                </Heading>
            </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                {currentYearData.map((data, index) => (
                  <Box key={index}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="bold" fontSize="sm" color={textColorSecondary}>{data.month}</Text>
                      <Text color={data.balance >= 0 ? 'green.500' : 'red.500'} fontWeight="bold" fontSize="sm">
                          {formatCurrency(data.balance)}
                      </Text>
                    </HStack>
                      <Box position="relative" height="12px" bg="gray.100" borderRadius="md" overflow="hidden">
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        height="100%"
                        bg="green.500"
                        borderRadius="md"
                        width={`${Math.max(0, (data.income / Math.max(...currentYearData.map(d => d.income), 1))) * 100}%`}
                      />
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        height="100%"
                        bg="red.500"
                        borderRadius="md"
                        width={`${Math.max(0, (data.expenses / Math.max(...currentYearData.map(d => d.expenses), 1))) * 100}%`}
                        opacity="0.7"
                      />
                    </Box>
                      <Text fontSize="sm" color={textColorSecondary} mt={1}>
                        Saldo: {formatCurrency(data.balance)}
                      </Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
          </MotionBox>

          {/* Right Column: Payment Status and Recent Activity */}
          <VStack spacing={6} align="stretch">
          {/* Payment Status */}
            <MotionBox variants={itemVariants}>
              <Card
                bg={cardBgWhite}
                borderWidth="1px"
                borderColor={cardBorderColor}
                _hover={{ boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                <CardHeader pb={4}>
                  <Heading size="md" color={textColor}>
                    💳 Status de Pagamentos
                  </Heading>
            </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={6} align="stretch">
                <Box>
                      <HStack justify="space-between" mb={3}>
                        <Text fontWeight="medium" color={textColorSecondary}>Progresso do Mês</Text>
                        <Text fontWeight="bold" color={textColor}>{Math.round(paymentStatus.paymentRate)}%</Text>
                  </HStack>
                  <Progress 
                    value={paymentStatus.paymentRate} 
                    colorScheme={paymentStatus.paymentRate >= 80 ? 'green' : paymentStatus.paymentRate >= 50 ? 'yellow' : 'red'}
                        size={{ base: "md", md: "lg" }}
                    borderRadius="md"
                        height="12px"
                  />
                </Box>
                
                <Divider />
                
                <Box>
                      <Text fontWeight="bold" mb={3} color={textColorSecondary}>Frações Pagas</Text>
                      <SimpleGrid columns={2} spacing={3}>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map(fraction => {
                          const isPaid = paymentStatus.fullyPaidFractions.includes(fraction)
                      return (
                        <HStack key={fraction} spacing={2}>
                          <Icon 
                                as={isPaid ? CheckCircleIcon : WarningIcon} 
                                color={isPaid ? 'green.500' : 'red.500'} 
                          />
                          <Text>Fração {fraction}</Text>
                        </HStack>
                      )
                    })}
                  </SimpleGrid>
                </Box>
              </VStack>
            </CardBody>
          </Card>
            </MotionBox>

        {/* Recent Activity */}
            <MotionBox variants={itemVariants}>
              <Card
                bg={cardBgWhite}
                borderWidth="1px"
                borderColor={cardBorderColor}
                _hover={{ boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                <CardHeader pb={4}>
                  <Heading size="md" color={textColor}>
                    📈 Atividade Recente
                  </Heading>
          </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={4} align="stretch">
                    {activityLogs.length > 0 ? (
                      activityLogs.slice(0, 5).map((activity) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'proof_uploaded':
                          return <CheckCircleIcon color="green.500" />
                        case 'proof_deleted':
                              return <WarningIcon color="red.500" />
                        case 'budget_created':
                              return <CheckCircleIcon color="blue.500" />
                        case 'budget_deleted':
                              return <WarningIcon color="red.500" />
                        case 'budget_updated':
                              return <WarningIcon color="orange.500" />
                        default:
                          return <CheckCircleIcon color="gray.500" />
                      }
                    }
                    
                    const getActivityColor = (type: string) => {
                      switch (type) {
                        case 'proof_uploaded':
                        case 'budget_created':
                          return 'green'
                        case 'proof_deleted':
                        case 'budget_deleted':
                          return 'red'
                        case 'budget_updated':
                          return 'orange'
                        default:
                          return 'gray'
                      }
                    }
                    
                    const getActivityLabel = (type: string) => {
                      switch (type) {
                        case 'proof_uploaded':
                          return 'Comprovativo Enviado'
                        case 'proof_deleted':
                          return 'Comprovativo Eliminado'
                        case 'budget_created':
                          return 'Item Adicionado'
                        case 'budget_deleted':
                          return 'Item Eliminado'
                        case 'budget_updated':
                          return 'Item Atualizado'
                        default:
                          return 'Atividade'
                      }
                    }
                    
                    return (
                          <Box
                            key={activity.id}
                            p={4}
                            bg={useColorModeValue('gray.50', 'gray.700')}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                            _hover={{ bg: useColorModeValue('gray.100', 'gray.600'), borderColor: useColorModeValue('gray.300', 'gray.500') }}
                            transition="all 0.2s"
                          >
                            <HStack justify="space-between" align="start">
                              <HStack spacing={3} align="start">
                                <Box
                                  p={2}
                                  borderRadius="full"
                                  bg={`${getActivityColor(activity.type)}.100`}
                                  color={`${getActivityColor(activity.type)}.600`}
                                >
                                  {getActivityIcon(activity.type)}
                                </Box>
                          <VStack align="start" spacing={1}>
                                  <Text fontWeight="bold" fontSize="sm" color={textColor}>
                                    {getActivityLabel(activity.type)}
                                  </Text>
                                  <Text fontSize="sm" color={textColorSecondary} lineHeight="relaxed">
                                    {activity.description}
                            </Text>
                                  <HStack spacing={1} color={textColorMuted} fontSize="xs">
                                    <TimeIcon />
                                    <Text>
                                      {new Date(activity.createdAt).toLocaleDateString('pt-PT')} às {new Date(activity.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                                  </HStack>
                          </VStack>
                        </HStack>
                              <Badge
                                colorScheme={getActivityColor(activity.type)}
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {getActivityLabel(activity.type)}
                        </Badge>
                      </HStack>
                          </Box>
                    )
                      })
                    ) : (
                      <Center py={8}>
                        <VStack spacing={3}>
                          <Box fontSize="4xl">📈</Box>
                          <Text color={textColorMuted} fontSize="lg">
                            Nenhuma atividade recente
                          </Text>
                          <Text color={textColorMuted} fontSize="sm">
                            As atividades aparecerão aqui quando houver movimentações
                          </Text>
                        </VStack>
                      </Center>
              )}
            </VStack>
          </CardBody>
        </Card>
            </MotionBox>
      </VStack>
        </Grid>
      </MotionBox>
    </Container>
  )
} 