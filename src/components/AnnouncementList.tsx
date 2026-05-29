import {
  Box,
  VStack,
  Heading,
  Text,
  Badge,
  useColorModeValue,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  IconButton,
  HStack,
  Flex,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Avatar,
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
  useToast,
} from '@chakra-ui/react'
import { 
  DeleteIcon, 
  AddIcon, 
  InfoIcon, 
  CheckCircleIcon, 
  WarningIcon,
  TimeIcon,
  ChatIcon,
  StarIcon
} from '@chakra-ui/icons'
import { motion } from 'framer-motion'
import AnnouncementForm from './AnnouncementForm'
import { useState } from 'react'

interface Announcement {
  id: string
  type: 'informacao' | 'sugestao' | 'queixa'
  category: string
  description: string
  status: 'active' | 'inactive'
  createdAt: string
  userEmail: string
  fraction: string
}

interface User {
  email: string
  fraction: string
  is_admin?: boolean
  name?: string | null
}

interface AnnouncementListProps {
  announcements: Announcement[]
  user: User
  userMap: Record<string, string>
  onNewAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'status'>) => void
  onDeleteAnnouncement: (id: string) => void
}

const MotionBox = motion(Box)

export default function AnnouncementList({
  announcements,
  user,
  userMap,
  onNewAnnouncement,
  onDeleteAnnouncement,
}: AnnouncementListProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null)
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const mutedColor = useColorModeValue('gray.600', 'gray.400')

  const stats = {
    total: announcements.length,
    informacao: announcements.filter(a => a.type === 'informacao').length,
    sugestao: announcements.filter(a => a.type === 'sugestao').length,
    queixa: announcements.filter(a => a.type === 'queixa').length,
  }

  const handleNewAnnouncement = (data: any) => {
    onNewAnnouncement(data)
    onClose()
  }

  const handleDeleteAnnouncement = (id: string) => {
    const announcement = announcements.find(a => a.id === id)
    if (announcement) {
      setAnnouncementToDelete(announcement)
      setShowDeleteModal(true)
    }
  }

  const confirmDelete = async () => {
    if (announcementToDelete) {
      setDeletingAnnouncementId(announcementToDelete.id)
      try {
        await onDeleteAnnouncement(announcementToDelete.id)
        toast({
          title: 'Anúncio eliminado',
          description: 'O anúncio foi eliminado com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } catch (error) {
        toast({
          title: 'Erro ao eliminar anúncio',
          description: 'Ocorreu um erro ao eliminar o anúncio.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setDeletingAnnouncementId(null)
        setShowDeleteModal(false)
        setAnnouncementToDelete(null)
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'informacao':
        return 'blue'
      case 'sugestao':
        return 'green'
      case 'queixa':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'informacao':
        return 'Informação'
      case 'sugestao':
        return 'Sugestão'
      case 'queixa':
        return 'Queixa'
      default:
        return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'informacao':
        return <InfoIcon />
      case 'sugestao':
        return <CheckCircleIcon />
      case 'queixa':
        return <WarningIcon />
      default:
        return <InfoIcon />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getAnnouncementsByType = (type: string) => {
    return announcements.filter(announcement => announcement.type === type)
  }

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
      {/* Header with Stats */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        mb={8}
      >
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="2xl" color={textColor} mb={2}>
              📢 Anúncios
            </Heading>
            <Text fontSize="lg" color={mutedColor}>
              Comunicação do condomínio
            </Text>
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size={{ base: "sm", md: "md" }}
            onClick={onOpen}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s"
            borderRadius="lg"
          >
            Novo
          </Button>
        </Flex>

        {/* Stats Grid */}
        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4} mb={8}>
          <Stat>
            <StatLabel>Total</StatLabel>
            <StatNumber>{stats.total}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {stats.total > 0 ? 'Ativos' : 'Nenhum'}
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Informações</StatLabel>
            <StatNumber color="blue.500">{stats.informacao}</StatNumber>
            <StatHelpText>Compartilhadas</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Sugestões</StatLabel>
            <StatNumber color="green.500">{stats.sugestao}</StatNumber>
            <StatHelpText>Recebidas</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Queixas</StatLabel>
            <StatNumber color="red.500">{stats.queixa}</StatNumber>
            <StatHelpText>Reportadas</StatHelpText>
          </Stat>
        </Grid>
      </MotionBox>

      {/* Tabs for Announcement Types */}
      <Tabs isFitted variant="soft-rounded" colorScheme="blue" align="center" mb={8}>
        <TabList
          w={{ base: 'full', md: 'auto' }}
          overflowX={{ base: 'auto', md: 'hidden' }}
          sx={{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
          }}
        >
          <Tab>📋 Todos ({stats.total})</Tab>
          <Tab>ℹ️ Informações ({stats.informacao})</Tab>
          <Tab>💡 Sugestões ({stats.sugestao})</Tab>
          <Tab>⚠️ Queixas ({stats.queixa})</Tab>
        </TabList>
        <TabPanels>
          {/* All Announcements */}
          <TabPanel p={0} pt={4}>
            <MotionBox
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <VStack spacing={4} align="stretch">
                {announcements.map((announcement) => (
                  <MotionBox
                    key={announcement.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      bg={bgColor}
                      borderWidth="1px"
                      borderColor={borderColor}
                      _hover={{ borderColor: `${getTypeColor(announcement.type)}.300`, boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Box
                              p={2}
                              borderRadius="full"
                              bg={`${getTypeColor(announcement.type)}.100`}
                              color={`${getTypeColor(announcement.type)}.600`}
                            >
                              {getTypeIcon(announcement.type)}
                            </Box>
                            <Box>
                              <Badge colorScheme={getTypeColor(announcement.type)} variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                {getTypeLabel(announcement.type)}
                              </Badge>
                              <Text fontWeight="bold" fontSize="lg" mt={1}>
                                {announcement.category}
                              </Text>
                            </Box>
                          </HStack>
                          {(user.is_admin || announcement.userEmail === user.email) && (
                            <IconButton
                              aria-label="Eliminar anúncio"
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              variant="solid"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              _hover={{ bg: 'red.600' }}
                              _active={{ bg: 'red.700' }}
                            />
                          )}
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text mb={4} lineHeight="relaxed">
                          {announcement.description}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4} color={mutedColor} fontSize="sm">
                            <HStack spacing={1}>
                              <TimeIcon />
                              <Text>{formatDate(announcement.createdAt)}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <ChatIcon />
                              <Text>Fração {announcement.fraction.toUpperCase()}</Text>
                            </HStack>
                          </HStack>
                          <Avatar 
                            size="sm" 
                            name={userMap[announcement.userEmail] || announcement.userEmail}
                            bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                            color="white"
                            fontWeight="bold"
                            boxShadow="0 2px 8px rgba(49, 130, 206, 0.3)"
                          />
                        </Flex>
                      </CardBody>
                    </Card>
                  </MotionBox>
                ))}
              </VStack>
            </MotionBox>
          </TabPanel>

          {/* Information Announcements */}
          <TabPanel p={0} pt={4}>
            <MotionBox
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <VStack spacing={4} align="stretch">
                {getAnnouncementsByType('informacao').map((announcement) => (
                  <MotionBox
                    key={announcement.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      bg={bgColor}
                      borderWidth="1px"
                      borderColor={borderColor}
                      _hover={{ borderColor: 'blue.300', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Box
                              p={2}
                              borderRadius="full"
                              bg="blue.100"
                              color="blue.600"
                            >
                              <InfoIcon />
                            </Box>
                            <Box>
                              <Badge colorScheme="blue" variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                Informação
                              </Badge>
                              <Text fontWeight="bold" fontSize="lg" mt={1}>
                                {announcement.category}
                              </Text>
                            </Box>
                          </HStack>
                          {(user.is_admin || announcement.userEmail === user.email) && (
                            <IconButton
                              aria-label="Eliminar anúncio"
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              variant="solid"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              _hover={{ bg: 'red.600' }}
                              _active={{ bg: 'red.700' }}
                            />
                          )}
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text mb={4} lineHeight="relaxed">
                          {announcement.description}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4} color={mutedColor} fontSize="sm">
                            <HStack spacing={1}>
                              <TimeIcon />
                              <Text>{formatDate(announcement.createdAt)}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <ChatIcon />
                              <Text>Fração {announcement.fraction.toUpperCase()}</Text>
                            </HStack>
                          </HStack>
                          <Avatar 
                            size="sm" 
                            name={userMap[announcement.userEmail] || announcement.userEmail}
                            bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                            color="white"
                            fontWeight="bold"
                            boxShadow="0 2px 8px rgba(49, 130, 206, 0.3)"
                          />
                        </Flex>
                      </CardBody>
                    </Card>
                  </MotionBox>
                ))}
              </VStack>
            </MotionBox>
          </TabPanel>

          {/* Suggestion Announcements */}
          <TabPanel p={0} pt={4}>
            <MotionBox
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <VStack spacing={4} align="stretch">
                {getAnnouncementsByType('sugestao').map((announcement) => (
                  <MotionBox
                    key={announcement.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      bg={bgColor}
                      borderWidth="1px"
                      borderColor={borderColor}
                      _hover={{ borderColor: 'green.300', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Box
                              p={2}
                              borderRadius="full"
                              bg="green.100"
                              color="green.600"
                            >
                              <CheckCircleIcon />
                            </Box>
                            <Box>
                              <Badge colorScheme="green" variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                Sugestão
                              </Badge>
                              <Text fontWeight="bold" fontSize="lg" mt={1}>
                                {announcement.category}
                              </Text>
                            </Box>
                          </HStack>
                          {(user.is_admin || announcement.userEmail === user.email) && (
                            <IconButton
                              aria-label="Eliminar anúncio"
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              variant="solid"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              _hover={{ bg: 'red.600' }}
                              _active={{ bg: 'red.700' }}
                            />
                          )}
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text mb={4} lineHeight="relaxed">
                          {announcement.description}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4} color={mutedColor} fontSize="sm">
                            <HStack spacing={1}>
                              <TimeIcon />
                              <Text>{formatDate(announcement.createdAt)}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <ChatIcon />
                              <Text>Fração {announcement.fraction.toUpperCase()}</Text>
                            </HStack>
                          </HStack>
                          <Avatar 
                            size="sm" 
                            name={userMap[announcement.userEmail] || announcement.userEmail}
                            bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                            color="white"
                            fontWeight="bold"
                            boxShadow="0 2px 8px rgba(49, 130, 206, 0.3)"
                          />
                        </Flex>
                      </CardBody>
                    </Card>
                  </MotionBox>
                ))}
              </VStack>
            </MotionBox>
          </TabPanel>

          {/* Complaint Announcements */}
          <TabPanel p={0} pt={4}>
            <MotionBox
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <VStack spacing={4} align="stretch">
                {getAnnouncementsByType('queixa').map((announcement) => (
                  <MotionBox
                    key={announcement.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      bg={bgColor}
                      borderWidth="1px"
                      borderColor={borderColor}
                      _hover={{ borderColor: 'red.300', boxShadow: 'lg' }}
                      transition="all 0.2s"
                    >
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Box
                              p={2}
                              borderRadius="full"
                              bg="red.100"
                              color="red.600"
                            >
                              <WarningIcon />
                            </Box>
                            <Box>
                              <Badge colorScheme="red" variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                Queixa
                              </Badge>
                              <Text fontWeight="bold" fontSize="lg" mt={1}>
                                {announcement.category}
                              </Text>
                            </Box>
                          </HStack>
                          {(user.is_admin || announcement.userEmail === user.email) && (
                            <IconButton
                              aria-label="Eliminar anúncio"
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              variant="solid"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              _hover={{ bg: 'red.600' }}
                              _active={{ bg: 'red.700' }}
                            />
                          )}
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text mb={4} lineHeight="relaxed">
                          {announcement.description}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4} color={mutedColor} fontSize="sm">
                            <HStack spacing={1}>
                              <TimeIcon />
                              <Text>{formatDate(announcement.createdAt)}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <ChatIcon />
                              <Text>Fração {announcement.fraction.toUpperCase()}</Text>
                            </HStack>
                          </HStack>
                          <Avatar 
                            size="sm" 
                            name={userMap[announcement.userEmail] || announcement.userEmail}
                            bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
                            color="white"
                            fontWeight="bold"
                            boxShadow="0 2px 8px rgba(49, 130, 206, 0.3)"
                          />
                        </Flex>
                      </CardBody>
                    </Card>
                  </MotionBox>
                ))}
              </VStack>
            </MotionBox>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* New Announcement Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>📢 Novo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <AnnouncementForm user={user} onSubmit={handleNewAnnouncement} onClose={onClose} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>Confirmar Eliminação</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="medium">
                Tem a certeza que pretende eliminar este anúncio?
              </Text>
              {announcementToDelete && (
                <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md" w="full">
                  <HStack spacing={3} mb={2}>
                    <Box
                      p={2}
                      borderRadius="full"
                      bg={`${getTypeColor(announcementToDelete.type)}.100`}
                      color={`${getTypeColor(announcementToDelete.type)}.600`}
                    >
                      {getTypeIcon(announcementToDelete.type)}
                    </Box>
                    <Box>
                      <Badge colorScheme={getTypeColor(announcementToDelete.type)} variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                        {getTypeLabel(announcementToDelete.type)}
                      </Badge>
                      <Text fontWeight="semibold" mt={1}>
                        {announcementToDelete.category}
                      </Text>
                    </Box>
                  </HStack>
                  <Text fontSize="sm" color={mutedColor} lineHeight="relaxed">
                    {announcementToDelete.description}
                  </Text>
                </Box>
              )}
              <Text fontSize="sm" color={mutedColor}>
                Esta ação não pode ser desfeita.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              colorScheme="red" 
              onClick={confirmDelete}
              isLoading={deletingAnnouncementId === announcementToDelete?.id}
              isDisabled={deletingAnnouncementId === announcementToDelete?.id}
            >
              Eliminar Anúncio
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
} 