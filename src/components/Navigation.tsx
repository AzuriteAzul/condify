import {
  Box,
  Flex,
  Button,
  IconButton,
  useColorMode,
  useColorModeValue,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useDisclosure,
  useBreakpointValue,
  Badge,
  Tooltip,
  Container,
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  MoonIcon, 
  SunIcon, 
  SettingsIcon, 
  HamburgerIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons'
import { 
  FaUser, 
  FaHome, 
  FaBullhorn, 
  FaTasks, 
  FaCreditCard, 
  FaChartPie, 
  FaCog, 
  FaSignOutAlt,
  FaUserShield,
  FaBuilding,
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'

const MotionBox = motion(Box)

interface NavigationProps {
  user: {
    email: string
    fraction: string
    is_admin: boolean
    name?: string | null
    user_metadata?: {
      avatar_url?: string
    }
  }
  onLogout: () => void
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const { colorMode, toggleColorMode } = useColorMode()
  const location = useLocation()
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const shadow = useColorModeValue('0 2px 20px rgba(0,0,0,0.07)', '0 2px 20px rgba(0,0,0,0.5)')
  
  const isMobile = useBreakpointValue({ base: true, md: false })

  const isActive = (path: string) => location.pathname === path

  const handleSettingsClick = () => {
    navigate('/settings')
    if (isMobile) onClose()
  }

  const handleLogout = () => {
    onLogout()
    if (isMobile) onClose()
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FaHome },
    { path: '/announcements', label: 'Anúncios', icon: FaBullhorn },
    { path: '/kanban', label: 'Tarefas', icon: FaTasks },
    { path: '/quotes', label: 'Quotas', icon: FaCreditCard },
    { path: '/budget', label: 'Orçamento', icon: FaChartPie },
    ...(user.is_admin ? [{ path: '/admin', label: 'Admin', icon: FaUserShield }] : []),
  ]

  const getNavIcon = (icon: any) => {
    const IconComponent = icon
    return <IconComponent size={16} />
  }

  const NavButtons = () => (
    <VStack spacing={2} align="stretch" w="full">
      {navItems.map((item) => (
        <MotionBox
          key={item.path}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            as={RouterLink}
            to={item.path}
            variant={isActive(item.path) ? 'solid' : 'ghost'}
            colorScheme={isActive(item.path) ? 'blue' : 'gray'}
            size="md"
            justifyContent="flex-start"
            onClick={isMobile ? onClose : undefined}
            leftIcon={getNavIcon(item.icon)}
            _hover={{
              bg: isActive(item.path) ? 'blue.600' : hoverBg,
              transform: 'translateX(4px)',
            }}
            transition="all 0.2s"
            borderRadius="lg"
            fontWeight="medium"
          >
            {item.label}
          </Button>
        </MotionBox>
      ))}
    </VStack>
  )

  return (
    <MotionBox
      as="nav"
      position="sticky"
      top={0}
      zIndex={10}
      bg={useColorModeValue('whiteAlpha.800', 'gray.800')}
      borderBottom="1px"
      borderColor={borderColor}
      backdropFilter="blur(12px)"
      boxShadow={shadow}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" py={3}>
          {/* Logo/Brand */}
          <MotionBox
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HStack spacing={3} cursor="pointer" onClick={() => navigate('/')}>
              <Box
                w={10}
                h={10}
                borderRadius="xl"
                bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 12px rgba(49, 130, 206, 0.4)"
                _hover={{
                  boxShadow: '0 6px 20px rgba(49, 130, 206, 0.6)',
                }}
                transition="all 0.3s"
              >
                <FaBuilding size={20} color="white" />
              </Box>
              <Box>
                <Text 
                  fontWeight="bold" 
                  fontSize="lg" 
                  color={textColor}
                  bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                  bgClip="text"
                >
                  Condify
                </Text>
                <Text fontSize="xs" color={textColorSecondary}>
                  Gestão de Condomínio
                </Text>
              </Box>
            </HStack>
          </MotionBox>

          {/* Mobile hamburger menu */}
          {isMobile && (
            <MotionBox whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                aria-label="Open navigation menu"
                icon={<HamburgerIcon />}
                onClick={onOpen}
                variant="ghost"
                colorScheme="blue"
                size="md"
                borderRadius="lg"
                _hover={{
                  bg: hoverBg,
                  transform: 'rotate(90deg)',
                }}
                transition="all 0.3s"
              />
            </MotionBox>
          )}

          {/* Desktop navigation */}
          {!isMobile && (
            <HStack spacing={2}>
              {navItems.map((item) => (
                <MotionBox
                  key={item.path}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Button
                    as={RouterLink}
                    to={item.path}
                    variant={isActive(item.path) ? 'solid' : 'ghost'}
                    colorScheme={isActive(item.path) ? 'blue' : 'gray'}
                    size="md"
                    leftIcon={getNavIcon(item.icon)}
                    _hover={{
                      bg: isActive(item.path) ? 'blue.600' : hoverBg,
                      transform: 'translateY(-2px)',
                      boxShadow: isActive(item.path) ? '0 4px 12px rgba(59, 130, 246, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                    transition="all 0.2s"
                    borderRadius="lg"
                    fontWeight="medium"
                    position="relative"
                    _before={
                      isActive(item.path)
                        ? {
                            content: '""',
                            position: 'absolute',
                            bottom: '-3px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '20px',
                            height: '3px',
                            bg: 'blue.500',
                            borderRadius: 'full',
                          }
                        : {}
                    }
                  >
                    {item.label}
                  </Button>
                </MotionBox>
              ))}
            </HStack>
          )}

          {/* Right side controls */}
          <HStack spacing={3}>
            {/* Color mode toggle */}
            <MotionBox whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Tooltip label={`Mudar para modo ${colorMode === 'light' ? 'escuro' : 'claro'}`}>
                <IconButton
                  aria-label="Toggle color mode"
                  icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                  onClick={toggleColorMode}
                  variant="ghost"
                  colorScheme="blue"
                  size="md"
                  borderRadius="lg"
                  _hover={{
                    bg: hoverBg,
                    transform: 'rotate(180deg)',
                  }}
                  transition="all 0.3s"
                />
              </Tooltip>
            </MotionBox>

            {/* User menu */}
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                colorScheme="blue"
                size="md"
                borderRadius="lg"
                _hover={{
                  bg: hoverBg,
                  transform: 'scale(1.05)',
                }}
                transition="all 0.2s"
                rightIcon={<ChevronDownIcon />}
              >
                <HStack spacing={3}>
                  <Avatar
                    size="sm"
                    name={user.name || user.email}
                    src={user.user_metadata?.avatar_url}
                    bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                    color="white"
                    fontWeight="bold"
                    boxShadow="0 2px 8px rgba(49, 130, 206, 0.3)"
                  />
                  <Box textAlign="left">
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {user.name || user.email.split('@')[0]}
                    </Text>
                    <HStack spacing={1}>
                      <Badge size="sm" colorScheme="blue" variant="subtle">
                        {user.fraction}
                      </Badge>
                      {user.is_admin && (
                        <Badge size="sm" colorScheme="purple" variant="subtle">
                          Admin
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList bg={useColorModeValue('white', 'gray.900')} borderColor={useColorModeValue('gray.200', 'gray.700')}>
                <MenuItem
                  onClick={handleSettingsClick}
                  icon={<SettingsIcon />}
                  _hover={{ bg: hoverBg }}
                  borderRadius="md"
                  transform="perspective(1px) translateZ(0)"
                >
                  <Text fontWeight="medium">Configurações</Text>
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  icon={<FaSignOutAlt />}
                  _hover={{ bg: useColorModeValue('red.50', 'red.900'), color: 'red.400' }}
                  color={useColorModeValue('red.500', 'red.400')}
                  borderRadius="md"
                  transform="perspective(1px) translateZ(0)"
                >
                  <Text fontWeight="medium">Terminar Sessão</Text>
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Container>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={bgColor} borderRightColor={borderColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" pb={4}>
            <HStack spacing={3}>
              <Box
                w={8}
                h={8}
                borderRadius="lg"
                bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FaBuilding size={16} color="white" />
              </Box>
              <Box>
                <Text 
                  fontWeight="bold" 
                  fontSize="md" 
                  color={textColor}
                  bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                  bgClip="text"
                >
                  Condify
                </Text>
                <Text fontSize="xs" color={textColorSecondary}>
                  Menu
                </Text>
              </Box>
            </HStack>
          </DrawerHeader>
          <DrawerBody pt={6}>
            <VStack spacing={4} align="stretch">
              <Box p={4} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                <HStack spacing={3}>
                  <Avatar
                    size="md"
                    name={user.name || user.email}
                    src={user.user_metadata?.avatar_url}
                    bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                    color="white"
                    fontWeight="bold"
                    boxShadow="0 2px 8px rgba(49, 130, 206, 0.3)"
                  />
                  <Box>
                    <Text fontSize="md" fontWeight="bold" color={textColor}>
                      {user.name || user.email.split('@')[0]}
                    </Text>
                    <HStack spacing={1}>
                      <Badge size="sm" colorScheme="blue" variant="subtle">
                        {user.fraction}
                      </Badge>
                      {user.is_admin && (
                        <Badge size="sm" colorScheme="purple" variant="subtle">
                          Admin
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                </HStack>
              </Box>
              <NavButtons />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </MotionBox>
  )
} 