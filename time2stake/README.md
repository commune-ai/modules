 # start of file
# Time2Stake Substrate Pallet

A fully functional Substrate pallet for staking management with enhanced time-based features. This pallet provides a flexible staking mechanism with time-locked rewards, vesting periods, and automated compounding options.

## Features

- Time-based staking rewards
- Configurable lock periods with bonus incentives
- Automated reward compounding
- Vesting schedules for rewards
- Slashing protection mechanisms
- Governance integration
- Comprehensive event and error handling

## Installation

### Prerequisites

- Rust and Cargo (latest stable)
- Substrate development environment
- Docker (for containerized deployment)

### Adding to Your Runtime

1. Add the pallet to your runtime's `Cargo.toml`:

```toml
[dependencies]
time2stake = { version = "0.1.0", default-features = false, git = "https://github.com/yourusername/time2stake.git" }

[features]
default = ["std"]
std = [
    # ...
    "time2stake/std",
    # ...
]
```

2. Implement the pallet's configuration trait in your runtime:

```rust
parameter_types! {
    pub const MinimumStakingPeriod: BlockNumber = 7 * DAYS;
    pub const MaximumStakingPeriod: BlockNumber = 365 * DAYS;
    pub const RewardRate: Permill = Permill::from_percent(5);
}

impl time2stake::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type MinimumStakingPeriod = MinimumStakingPeriod;
    type MaximumStakingPeriod = MaximumStakingPeriod;
    type RewardRate = RewardRate;
    type WeightInfo = time2stake::weights::SubstrateWeight<Runtime>;
}
```

3. Add the pallet to your `construct_runtime!` macro:

```rust
construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = opaque::Block,
        UncheckedExtrinsic = UncheckedExtrinsic
    {
        // ...
        Time2Stake: time2stake,
        // ...
    }
);
```

## Usage

### Staking Tokens

```rust
// Stake 100 tokens for 30 days
Time2Stake::stake(Origin::signed(account_id), 100, 30 * DAYS);

// Stake with auto-compounding enabled
Time2Stake::stake_with_compound(Origin::signed(account_id), 100, 30 * DAYS, true);
```

### Unstaking Tokens

```rust
// Unstake all tokens
Time2Stake::unstake_all(Origin::signed(account_id));

// Unstake specific amount
Time2Stake::unstake(Origin::signed(account_id), 50);
```

### Claiming Rewards

```rust
// Claim available rewards
Time2Stake::claim_rewards(Origin::signed(account_id));
```

## Docker Deployment

A Docker setup is provided for easy deployment and testing.

```bash
# Build the Docker image
docker build -t time2stake-node .

# Run the node
docker run -p 9944:9944 time2stake-node --dev --ws-external
```

## Development

### Building

```bash
cargo build --release
```

### Testing

```bash
cargo test
```

### Benchmarking

```bash
cargo run --release -- benchmark pallet --pallet time2stake --extrinsic '*' --steps 50 --repeat 20
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
