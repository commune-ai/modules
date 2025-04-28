
import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
  VStack,
  HStack,
  Divider,
  Code,
  Tag,
  TagLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import axios from 'axios'

// API endpoint
const API_URL = 'http://localhost:8000/api'

export default function Home() {
  const toast = useToast()
  const [participants, setParticipants] = useState<string[]>([])
  const [newParticipantId, setNewParticipantId] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [dataToEncrypt, setDataToEncrypt] = useState('')
  const [encryptedData, setEncryptedData] = useState<any>(null)
  const [decryptedShares, setDecryptedShares] = useState<any[]>([])
  const [finalDecryptedData, setFinalDecryptedData] = useState('')
  const [loading, setLoading] = useState(false)

  // Generate a keypair for a new participant
  const generateKeypair = async () => {
    if (!newParticipantId) {
      toast({
        title: 'Error',
        description: 'Please enter a participant ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (participants.includes(newParticipantId)) {
      toast({
        title: 'Error',
        description: 'Participant ID already exists',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/generate_keypair`, {
        participant_id: newParticipantId,
      })

      setParticipants([...participants, newParticipantId])
      setNewParticipantId('')
      
      toast({
        title: 'Success',
        description: `Keypair generated for ${newParticipantId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error generating keypair:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate keypair',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Toggle participant selection for encryption
  const toggleParticipantSelection = (participantId: string) => {
    if (selectedParticipants.includes(participantId)) {
      setSelectedParticipants(selectedParticipants.filter(p => p !== participantId))
    } else {
      setSelectedParticipants([...selectedParticipants, participantId])
    }
  }

  // Encrypt data using selected participants
  const encryptData = async () => {
    if (!dataToEncrypt) {
      toast({
        title: 'Error',
        description: 'Please enter data to encrypt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (selectedParticipants.length < 2) {
      toast({
        title: 'Error',
        description: 'Please select at least 2 participants',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/encrypt`, {
        data: dataToEncrypt,
        participant_ids: selectedParticipants,
      })

      setEncryptedData(response.data)
      setDecryptedShares([])
      setFinalDecryptedData('')
      
      toast({
        title: 'Success',
        description: 'Data encrypted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error encrypting data:', error)
      toast({
        title: 'Error',
        description: 'Failed to encrypt data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Decrypt a share using a participant's private key
  const decryptShare = async (participantId: string) => {
    if (!encryptedData) {
      toast({
        title: 'Error',
        description: 'No encrypted data available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/decrypt_share`, {
        encrypted_data: encryptedData,
        participant_id: participantId,
      })

      // Check if this share is already decrypted
      const existingIndex = decryptedShares.findIndex(
        share => share.participant_id === participantId
      )

      if (existingIndex >= 0) {
        // Replace existing share
        const newShares = [...decryptedShares]
        newShares[existingIndex] = response.data
        setDecryptedShares(newShares)
      } else {
        // Add new share
        setDecryptedShares([...decryptedShares, response.data])
      }
      
      toast({
        title: 'Success',
        description: `Share decrypted by ${participantId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error decrypting share:', error)
      toast({
        title: 'Error',
        description: `Failed to decrypt share for ${participantId}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Combine decrypted shares to recover the original data
  const combineShares = async () => {
    if (decryptedShares.length < 2) {
      toast({
        title: 'Error',
        description: 'Need at least 2 decrypted shares',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/combine_shares`, {
        decrypted_shares: decryptedShares,
      })

      setFinalDecryptedData(response.data)
      
      toast({
        title: 'Success',
        description: 'Shares combined successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error combining shares:', error)
      toast({
        title: 'Error',
        description: 'Failed to combine shares',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset the encryption/decryption process
  const resetProcess = () => {
    setEncryptedData(null)
    setDecryptedShares([])
    setFinalDecryptedData('')
    setDataToEncrypt('')
    setSelectedParticipants([])
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" mb={8} textAlign="center">
        Multiencrypt Demo
      </Heading>

      <Tabs variant="enclosed" colorScheme="teal">
        <TabList>
          <Tab>Setup</Tab>
          <Tab>Encrypt</Tab>
          <Tab>Decrypt</Tab>
        </TabList>

        <TabPanels>
          {/* Setup Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <Heading size="md" mb={4}>
                  Participant Management
                </Heading>
                <FormControl>
                  <FormLabel>New Participant ID</FormLabel>
                  <HStack>
                    <Input
                      value={newParticipantId}
                      onChange={(e) => setNewParticipantId(e.target.value)}
                      placeholder="Enter participant ID"
                    />
                    <Button
                      colorScheme="teal"
                      onClick={generateKeypair}
                      isLoading={loading}
                    >
                      Generate Keypair
                    </Button>
                  </HStack>
                </FormControl>
              </Box>

              <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <Heading size="md" mb={4}>
                  Registered Participants
                </Heading>
                {participants.length === 0 ? (
                  <Text>No participants registered yet</Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {participants.map((participant) => (
                      <Tag
                        key={participant}
                        size="lg"
                        borderRadius="full"
                        variant="solid"
                        colorScheme="teal"
                      >
                        <TagLabel>{participant}</TagLabel>
                      </Tag>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </TabPanel>

          {/* Encrypt Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <Heading size="md" mb={4}>
                  Select Participants for Encryption
                </Heading>
                {participants.length === 0 ? (
                  <Text>No participants registered yet</Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {participants.map((participant) => (
                      <Button
                        key={participant}
                        variant={
                          selectedParticipants.includes(participant)
                            ? "solid"
                            : "outline"
                        }
                        colorScheme="teal"
                        onClick={() => toggleParticipantSelection(participant)}
                      >
                        {participant}
                      </Button>
                    ))}
                  </VStack>
                )}
              </Box>

              <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <Heading size="md" mb={4}>
                  Data to Encrypt
                </Heading>
                <FormControl>
                  <FormLabel>Enter your secret message</FormLabel>
                  <Textarea
                    value={dataToEncrypt}
                    onChange={(e) => setDataToEncrypt(e.target.value)}
                    placeholder="Enter data to encrypt"
                    rows={4}
                  />
                </FormControl>
                <Button
                  mt={4}
                  colorScheme="teal"
                  onClick={encryptData}
                  isLoading={loading}
                  isDisabled={!dataToEncrypt || selectedParticipants.length < 2}
                >
                  Encrypt Data
                </Button>
              </Box>

              {encryptedData && (
                <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                  <Heading size="md" mb={4}>
                    Encrypted Data
                  </Heading>
                  <Code p={4} borderRadius="md" width="100%" overflowX="auto">
                    {JSON.stringify(encryptedData, null, 2)}
                  </Code>
                </Box>
              )}
            </VStack>
          </TabPanel>

          {/* Decrypt Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {!encryptedData ? (
                <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                  <Text>No encrypted data available. Please encrypt data first.</Text>
                </Box>
              ) : (
                <>
                  <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                    <Heading size="md" mb={4}>
                      Decrypt Shares
                    </Heading>
                    <Text mb={4}>
                      Each participant must decrypt their share using their private key.
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {Object.keys(encryptedData.encrypted_shares).map((participantId) => (
                        <Button
                          key={participantId}
                          colorScheme="teal"
                          variant={
                            decryptedShares.some(
                              (share) => share.participant_id === participantId
                            )
                              ? "solid"
                              : "outline"
                          }
                          onClick={() => decryptShare(participantId)}
                          isLoading={loading}
                        >
                          Decrypt as {participantId}
                        </Button>
                      ))}
                    </VStack>
                  </Box>

                  <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                    <Heading size="md" mb={4}>
                      Decrypted Shares ({decryptedShares.length}/
                      {encryptedData.required_signatures} required)
                    </Heading>
                    {decryptedShares.length === 0 ? (
                      <Text>No shares decrypted yet</Text>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        {decryptedShares.map((share) => (
                          <Tag
                            key={share.participant_id}
                            size="lg"
                            borderRadius="full"
                            variant="solid"
                            colorScheme="green"
                          >
                            <TagLabel>{share.participant_id}</TagLabel>
                          </Tag>
                        ))}
                      </VStack>
                    )}
                    <Button
                      mt={4}
                      colorScheme="teal"
                      onClick={combineShares}
                      isLoading={loading}
                      isDisabled={decryptedShares.length < encryptedData.required_signatures}
                    >
                      Combine Shares
                    </Button>
                  </Box>

                  {finalDecryptedData && (
                    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                      <Heading size="md" mb={4}>
                        Decrypted Data
                      </Heading>
                      <Text p={4} borderRadius="md" bg="gray.100">
                        {finalDecryptedData}
                      </Text>
                      <Button mt={4} colorScheme="red" onClick={resetProcess}>
                        Reset
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  )
}
